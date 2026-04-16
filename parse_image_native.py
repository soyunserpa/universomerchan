import sys
from PIL import Image
import pytesseract

def main():
    if len(sys.argv) < 2:
        print("Usage: python3 ocr.py <image_path>")
        sys.exit(1)
        
    image_path = sys.argv[1]
    
    try:
        # Open the image file
        img = Image.open(image_path)
        
        # Perform OCR
        text = pytesseract.image_to_string(img)
        print("--- EXTRACTED TEXT ---")
        print(text)
        
        # Try to find the exact token block
        lines = text.split('\n')
        token_lines = []
        in_token = False
        for line in lines:
            line = line.strip()
            if line.startswith("AQVK"):
                in_token = True
            
            if in_token and len(line) > 10:
                token_lines.append(line)
        
        if token_lines:
            print("\n--- POSSIBLE TOKEN BLOCK ---")
            print("".join(token_lines).replace(" ", ""))
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()
