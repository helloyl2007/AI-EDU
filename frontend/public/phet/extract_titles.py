import os
import json
from bs4 import BeautifulSoup

def extract_title_from_html(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            soup = BeautifulSoup(f, 'html.parser')
            title_tag = soup.title
            if title_tag:
                # 解码HTML实体
                return title_tag.get_text().strip()
            else:
                return os.path.basename(file_path).replace('_zh_CN.html', '').replace('-', ' ').title()
    except Exception as e:
        print(f"提取标题失败: {file_path}, 错误: {e}")
        return os.path.basename(file_path).replace('_zh_CN.html', '').replace('-', ' ').title()

def scan_and_extract(root_path):
    titles = {}
    for dirpath, dirnames, filenames in os.walk(root_path):
        for filename in filenames:
            if filename.endswith('_zh_CN.html'):
                file_path = os.path.join(dirpath, filename)
                title = extract_title_from_html(file_path)
                # 相对路径作为键
                rel_path = os.path.relpath(file_path, root_path).replace('\\', '/')
                titles[rel_path] = title
                print(f"提取: {rel_path} -> {title}")
    return titles

# 获取脚本所在目录作为根目录
root_path = os.path.dirname(os.path.abspath(__file__))
titles = scan_and_extract(root_path)

# 保存为JSON
with open('titles.json', 'w', encoding='utf-8') as f:
    json.dump(titles, f, ensure_ascii=False, indent=4)

print(f"提取完成，共 {len(titles)} 个标题，保存到 titles.json")
