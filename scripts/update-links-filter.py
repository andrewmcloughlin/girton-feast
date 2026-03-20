import os
import re

def update_links(directory):
    # Pattern 1: href, src, or srcset starting with /
    pattern1 = re.compile(r'(href|src|srcset)="(/[^"}{][^"]*)"')

    # Pattern 2: CSS url() starting with /
    # Captures the path in group 1
    pattern2 = re.compile(r"url\(['\"](/[^'\"}{][^'\"]*)['\"]\)")

    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith(('.njk', '.html', '.md')):
                file_path = os.path.join(root, file)
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()

                # Replace href/src attributes: href="{{ "/path" | url }}"
                new_content = pattern1.sub(r'\1="{{ "\2" | url }}"', content)
                
                # Replace url() in styles: url('{{ "/path" | url }}')
                new_content = pattern2.sub(r"url('{{ \"\1\" | url }}')", new_content)

                if new_content != content:
                    with open(file_path, 'w', encoding='utf-8') as f:
                        f.write(new_content)
                    print(f"Updated {file_path}")

if __name__ == "__main__":
    update_links('src')
