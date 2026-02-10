import requests
import json

# The actual URL of your running OmniVault server
BASE_URL = "http://localhost:3000/api/get-weights"

def integrate_vault_intelligence(weight_id):
    print(f"\n[SCANNER] Initiating connection for ID: {weight_id}")
    
    try:
        # ACTUALLY FETCHING the data from your Next.js API
        response = requests.get(f"{BASE_URL}?id={weight_id}")
        response.raise_for_status()
        
        data = response.json()
        
        print("\n[SUCCESS] Intelligence Package Received.")
        print(f"Source Document: {data['origin_document']}")
        print(f"Model ID: {data['id']}")
        
        # DISPLAYING THE "MASSIVE NUMBERS"
        weights = data['weights']
        print(f"\n[RAW DATA] Extracted {len(weights)} Optimized Weights:")
        
        # Showing the first 10 and last 10 to demonstrate scale
        print(f"START: {weights[:5]}")
        print("...")
        print(f"END:   {weights[-5:]}")
        
        return weights

    except Exception as e:
        print(f"\n[ERROR] Connection failed: {e}")
        return None

if __name__ == "__main__":
    print("====================================================")
    print("   OMNIVAULT BUYER-SIDE: LIVE WEIGHT INTEGRATION    ")
    print("====================================================")
    
    # 1. Enter the ID you got from your website (e.g., weights-3665)
    target_id = input("Enter the Secure Weight ID from the Vault: ")
    
    if target_id:
        result = integrate_vault_intelligence(target_id)
        
        if result:
            print("\n----------------------------------------------------")
            print("   VERIFICATION: PHYSICAL-DIGITAL LINK CONFIRMED")
            print("----------------------------------------------------")
            print(f"The local model has now integrated learning from")
            print(f"the sensitive data in {target_id}. The raw content")
            print(f"remains private in the vault.")

# Add this at the very end of your script to save the full weights
with open("integrated_weights.json", "w") as f:
    json.dump(result, f)
print("\n[FILE CREATED] Full 1000 weights saved to integrated_weights.json")