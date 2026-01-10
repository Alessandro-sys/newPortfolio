
import cloudinary
import cloudinary.api
from dotenv import load_dotenv
import os

load_dotenv()

def test_cloudinary():
    print("Testing Cloudinary connection...")
    
    # Check if CLOUDINARY_URL is set
    url = os.getenv("CLOUDINARY_URL")
    if url:
        print("CLOUDINARY_URL is found in env.")
    else:
        print("WARNING: CLOUDINARY_URL not found in env. Checking individual keys...")
        cloud_name = os.getenv("CLOUDINARY_CLOUD_NAME")
        api_key = os.getenv("CLOUDINARY_API_KEY")
        api_secret = os.getenv("CLOUDINARY_API_SECRET")
        
        if cloud_name and api_key and api_secret:
             print("Individual Cloudinary keys found.")
             cloudinary.config(
                cloud_name = cloud_name,
                api_key = api_key,
                api_secret = api_secret
             )
        else:
             print("ERROR: No Cloudinary configuration found in environment variables.")
             return

    tag_name = "astroGallery"
    print(f"Attempting to fetch resources with tag: {tag_name}")
    
    try:
        result = cloudinary.api.resources_by_tag(
            tag_name,
            max_results=10
        )
        resources = result.get('resources', [])
        print(f"Found {len(resources)} resources.")
        for r in resources:
            print(f" - {r['public_id']}")
            
    except Exception as e:
        print(f"FAILED: {e}")

if __name__ == "__main__":
    test_cloudinary()
