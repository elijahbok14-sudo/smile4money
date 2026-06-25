#![no_std]

mod errors;
mod types;

use errors::Error;
use soroban_sdk::{contract, contractimpl, symbol_short, Address, Env, String, Symbol};
use types::{DataKey, MatchResult, ResultEntry};

/// ~30 days at 5s/ledger.
const MATCH_TTL_LEDGERS: u32 = 518_400;

#[contract]
pub struct OracleContract;

#[contractimpl]
impl OracleContract {
    /// Initialize with a trusted admin (the off-chain oracle service).
    pub fn initialize(env: Env, admin: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("Contract already initialized");
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
    }

    /// Admin submits a verified match result on-chain.
    pub fn submit_result(
        env: Env,
        match_id: u64,
        game_id: String,
        result: MatchResult,
    ) -> Result<(), Error> {
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(Error::Unauthorized)?;
        admin.require_auth();

        if env.storage().persistent().has(&DataKey::Result(match_id)) {
            return Err(Error::AlreadySubmitted);
        }

        if game_id.len() > 64 {
            return Err(Error::InvalidGameId);
        }

        let ledger_seq = env.ledger().sequence();
        env.storage().persistent().set(
            &DataKey::Result(match_id),
            &ResultEntry {
                game_id,
                result: result.clone(),
                submitted_ledger: ledger_seq,
            },
        );
        env.storage().persistent().extend_ttl(
            &DataKey::Result(match_id),
            MATCH_TTL_LEDGERS,
            MATCH_TTL_LEDGERS,
        );

        env.events().publish(
            (Symbol::new(&env, "oracle"), symbol_short!("result")),
            (match_id, result),
        );

        Ok(())
    }

    /// Retrieve the stored result for a match.
    pub fn get_result(env: Env, match_id: u64) -> Result<ResultEntry, Error> {
        env.storage()
            .persistent()
            .get(&DataKey::Result(match_id))
            .ok_or(Error::ResultNotFound)
    }

    /// Check whether a result has been submitted for a match.
    pub fn has_result(env: Env, match_id: u64) -> bool {
        env.storage().persistent().has(&DataKey::Result(match_id))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use soroban_sdk::{
        testutils::{storage::Persistent as _, Address as _, Events},
        Address, Env, IntoVal, String, Symbol,
    };

    fn setup() -> (Env, Address) {
        let env = Env::default();
        env.mock_all_auths();
        let admin = Address::generate(&env);
        let contract_id = env.register(OracleContract, ());
        let client = OracleContractClient::new(&env, &contract_id);
        client.initialize(&admin);
        (env, contract_id)
    }

    #[test]
    fn test_submit_and_get_result() {
        let (env, contract_id) = setup();
        let client = OracleContractClient::new(&env, &contract_id);

        assert!(!client.has_result(&0u64));

        client.submit_result(&0u64, &String::from_str(&env, "abc123"), &MatchResult::Player1Wins);

        // event must be emitted (check before any other client calls)
        let events = env.events().all();
        let topics = soroban_sdk::vec![
            &env,
            Symbol::new(&env, "oracle").into_val(&env),
            symbol_short!("result").into_val(&env),
        ];
        let matched = events.iter().find(|(_, t, _)| *t == topics);
        assert!(matched.is_some());
        let (_, _, data) = matched.unwrap();
        let (ev_id, ev_result): (u64, MatchResult) =
            soroban_sdk::TryFromVal::try_from_val(&env, &data).unwrap();
        assert_eq!((ev_id, ev_result), (0u64, MatchResult::Player1Wins));

        assert!(client.has_result(&0u64));
        let entry = client.get_result(&0u64);
        assert_eq!(entry.result, MatchResult::Player1Wins);
        assert_eq!(entry.submitted_ledger, 0u32);

        // TTL must be extended
        let ttl = env.as_contract(&contract_id, || {
            env.storage().persistent().get_ttl(&DataKey::Result(0u64))
        });
        assert_eq!(ttl, crate::MATCH_TTL_LEDGERS);
    }

    #[test]
    fn test_get_result_not_found() {
        let (env, contract_id) = setup();
        let client = OracleContractClient::new(&env, &contract_id);
        assert!(matches!(client.try_get_result(&999u64), Err(Ok(Error::ResultNotFound))));
    }

    #[test]
    #[should_panic]
    fn test_duplicate_submit_fails() {
        let (env, contract_id) = setup();
        let client = OracleContractClient::new(&env, &contract_id);
        client.submit_result(&0u64, &String::from_str(&env, "abc123"), &MatchResult::Draw);
        client.submit_result(&0u64, &String::from_str(&env, "abc123"), &MatchResult::Draw);
    }

    #[test]
    #[should_panic]
    fn test_double_initialize_fails() {
        let env = Env::default();
        env.mock_all_auths();
        let admin = Address::generate(&env);
        let contract_id = env.register(OracleContract, ());
        let client = OracleContractClient::new(&env, &contract_id);
        client.initialize(&admin);
        client.initialize(&admin);
    }

    #[test]
    fn submit_result_long_game_id_returns_invalid() {
        let (env, contract_id) = setup();
        let client = OracleContractClient::new(&env, &contract_id);

        let long_game_id = String::from_str(&env, &"x".repeat(65));

        assert!(matches!(
            client.try_submit_result(&1u64, &long_game_id, &MatchResult::Player1Wins),
            Err(Ok(Error::InvalidGameId))
        ));
    }

    #[test]
    fn get_result_nonexistent_returns_not_found() {
        let (env, contract_id) = setup();
        let client = OracleContractClient::new(&env, &contract_id);

        assert!(matches!(
            client.try_get_result(&999u64),
            Err(Ok(Error::ResultNotFound))
        ));
    }

    #[test]
    fn submit_result_duplicate_returns_already_submitted() {
        let (env, contract_id) = setup();
        let client = OracleContractClient::new(&env, &contract_id);

        client.submit_result(&0u64, &String::from_str(&env, "abc123"), &MatchResult::Draw);

        assert!(matches!(
            client.try_submit_result(&0u64, &String::from_str(&env, "abc123"), &MatchResult::Draw),
            Err(Ok(Error::AlreadySubmitted))
        ));
    }
}
