import os
import re

def update_links(directory):
    # Regex to find href, src, or srcset starting with / but not // or {{
    # It catches things like /images/logo.png or /pages/about.html
    pattern = re.compile(r'(href|src|srcset)="(/[^"}{][^"]*)"')

    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith(('.njk', '.html', '.md')):
                file_path = os.path.join(root, file)
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()

                new_content = pattern.sub(r'\1="{{ "\2" | url }}"', content)

                if new_content != content:
                    with open(file_path, 'w', encoding='utf-8') as f:
                        f.write(new_content)
                    print(f"Updated {file_path}")

if __name__ == "__main__":
    update_links('src')
