import docx
import os
import json

def extract_text_from_docx(file_path):
    try:
        doc = docx.Document(file_path)
        full_text = []
        for para in doc.paragraphs:
            full_text.append(para.text)
        return '\n'.join(full_text)
    except Exception as e:
        return f"Error extracting text from {file_path}: {str(e)}"

def process_all_docx_files():
    upload_dir = '/home/ubuntu/upload'
    output_dir = '/home/ubuntu/cv_project/source_analysis'
    
    results = {}
    
    for filename in os.listdir(upload_dir):
        if filename.endswith('.docx'):
            file_path = os.path.join(upload_dir, filename)
            text_content = extract_text_from_docx(file_path)
            
            # Save to individual text file
            output_file = os.path.join(output_dir, f"{os.path.splitext(filename)[0]}.txt")
            with open(output_file, 'w', encoding='utf-8') as f:
                f.write(text_content)
            
            results[filename] = text_content
    
    # Save all results to a single JSON file for easier analysis
    with open(os.path.join(output_dir, 'all_documents.json'), 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2)
    
    return results

if __name__ == "__main__":
    process_all_docx_files()
    print("Document extraction complete. Results saved to source_analysis directory.")
