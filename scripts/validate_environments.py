import sys
import tomllib

REQUIRED_KEYS = {"network_passphrase", "rpc_url", "network"}


def validate(data):
    errors = []
    for env_name, config in data.items():
        if not isinstance(config, dict):
            continue
        missing = REQUIRED_KEYS - set(config.keys())
        if missing:
            errors.append(
                f"[{env_name}] missing required keys: {', '.join(sorted(missing))}"
            )
    return errors


def main():
    try:
        with open("environments.toml", "rb") as f:
            data = tomllib.load(f)
    except Exception as e:
        print(f"Error parsing environments.toml: {e}")
        sys.exit(1)

    errors = validate(data)
    if errors:
        print("Validation errors found:")
        for err in errors:
            print(f"  - {err}")
        sys.exit(1)

    print("environments.toml validation passed.")


if __name__ == "__main__":
    main()
