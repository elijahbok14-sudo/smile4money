import sys
import os

sys.path.insert(0, os.path.dirname(__file__))
from validate_environments import validate, REQUIRED_KEYS


def test_valid_config():
    data = {
        "testnet": {
            "rpc_url": "https://testnet.example.com",
            "network_passphrase": "Test Network",
            "network": "testnet",
        }
    }
    errors = validate(data)
    assert len(errors) == 0, f"Expected no errors, got: {errors}"
    print("PASS: test_valid_config")


def test_missing_rpc_url():
    data = {
        "testnet": {
            "network_passphrase": "Test Network",
            "network": "testnet",
        }
    }
    errors = validate(data)
    assert len(errors) == 1
    assert "rpc_url" in errors[0]
    print("PASS: test_missing_rpc_url")


def test_missing_all_keys():
    data = {"testnet": {}}
    errors = validate(data)
    assert len(errors) == 1
    for key in REQUIRED_KEYS:
        assert key in errors[0]
    print("PASS: test_missing_all_keys")


def test_multiple_environments():
    data = {
        "testnet": {
            "rpc_url": "https://testnet.example.com",
            "network_passphrase": "Test Network",
            "network": "testnet",
        },
        "mainnet": {
            "rpc_url": "https://mainnet.example.com",
            "network_passphrase": "Main Network",
        },
    }
    errors = validate(data)
    assert len(errors) == 1
    assert "mainnet" in errors[0]
    assert "network" in errors[0]
    print("PASS: test_multiple_environments")


def test_extra_keys_allowed():
    data = {
        "testnet": {
            "rpc_url": "https://testnet.example.com",
            "network_passphrase": "Test Network",
            "network": "testnet",
            "extra_field": "should be fine",
        }
    }
    errors = validate(data)
    assert len(errors) == 0
    print("PASS: test_extra_keys_allowed")


def test_empty_config():
    data = {}
    errors = validate(data)
    assert len(errors) == 0
    print("PASS: test_empty_config")


if __name__ == "__main__":
    test_valid_config()
    test_missing_rpc_url()
    test_missing_all_keys()
    test_multiple_environments()
    test_extra_keys_allowed()
    test_empty_config()
    print("\nAll tests passed.")
