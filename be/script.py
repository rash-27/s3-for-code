import requests
import sys

def make_single_api_call(url):
    """
    Sends Load to GET request to the specified URL and prints the response.
    """
    try:
        while True:
            response = requests.get(url, timeout=1)

            print(f"Status Code: {response.status_code}")

            print("\nResponse Content (first 300 chars):")
            print(response.text[:300])

    except requests.exceptions.RequestException as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    # Check if a URL was provided as a command-line argument.
    if len(sys.argv) < 2:
        print("Usage: python your_script_name.py <URL>")
        # Exit the script if no URL is provided.
        sys.exit(1)

    target_url = sys.argv[1]
    print(f"Making a single request to: {target_url}\n")
    make_single_api_call(target_url)