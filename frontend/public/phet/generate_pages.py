import os
import json

def load_titles(json_path):
    with open(json_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def generate_subject_page(subject, subdirs, titles, output_dir):
    subject_names = {
        'chemistry': '化学',
        'math': '数学',
        'physics': '物理',
        'biology': '生物'
    }
    subdir_names = {
        'general-chemistry': '普通化学',
        'math-concepts': '数学概念',
        'math-applications': '数学的应用',
        'optics-radiation': '光和辐射',
        'work-energy-power': '功、能量、功率',
        'sound-vibration-wave': '声音 振动 波',
        'thermodynamics': '热学',
        'electric-magnetic-circuit': '电场、磁场、电路',
        'motion': '运动'
    }
    
    # 创建科目目录
    subject_dir = os.path.join(output_dir, subject)
    os.makedirs(subject_dir, exist_ok=True)
    
    subject_name = subject_names.get(subject, subject.title())
    
    # 生成二级页面
    html_content = f'''<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{subject_name}</title>
    <link rel="stylesheet" href="../style.css">
</head>
<body>
    <header>
        <h1>{subject_name}</h1>
        <div class="filters">
            <input type="text" id="search" placeholder="搜索...">
            <select id="category">
                <option value="">所有子科目</option>
'''
    
    # 添加子科目选项
    for subdir in subdirs:
        sub_name = subdir_names.get(subdir, subdir.replace("-", " ").title())
        html_content += f'                <option value="{subdir}">{sub_name}</option>\n'
    
    html_content += '''            </select>
        </div>
    </header>
    <main>
        <div class="content-grid" id="contentGrid">
'''
    
    # 添加内容项（生成 <a class="content-card"> 可整体点击的卡片）
    for rel_path, title in titles.items():
        if rel_path.startswith(f'{subject}/'):
            # 去掉 subject 前缀
            short_path = rel_path[len(subject)+1:]
            # 提取缩略图路径
            png_path = short_path.replace('_zh_CN.html', '-420.png')
            # 提取子科目
            parts = short_path.split('/')
            subdir = parts[0] if len(parts) > 1 else ''
            # 清理标题
            clean_title = title.replace('\u202a', '').replace('\u202c', '').strip()

            html_content += f'''            <a class="content-card" href="{short_path}" data-category="{subdir}">
                <img src="{png_path}" alt="{clean_title}">
                <h3>{clean_title}</h3>
            </a>
'''
    
    html_content += '''        </div>
    </main>
    <script src="../script.js"></script>
</body>
</html>'''
    
    with open(os.path.join(subject_dir, 'index.html'), 'w', encoding='utf-8') as f:
        f.write(html_content)

def generate_main_page(subjects, output_dir):
    subject_names = {
        'chemistry': '化学',
        'math': '数学',
        'physics': '物理',
        'biology': '生物'
    }
    html_content = '''<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>小学仿真教学</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <header>
        <h1>小学仿真教学</h1>
    </header>
    <main>
        <div class="subject-grid">
'''
    
    for subject in subjects:
        name = subject_names.get(subject, subject.title())
        html_content += f'''            <a href="{subject}/index.html" class="subject-card">
                <h2>{name}</h2>
                <p>探索{name}世界的奥秘</p>
            </a>
'''
    
    html_content += '''        </div>
    </main>
</body>
</html>'''
    
    with open(os.path.join(output_dir, 'index.html'), 'w', encoding='utf-8') as f:
        f.write(html_content)

def generate_css(output_dir):
    """在输出目录生成默认 style.css（仅当文件不存在时）。"""
    css_path = os.path.join(output_dir, 'style.css')
    if os.path.exists(css_path):
        print('style.css 已存在，跳过默认样式写入以免覆盖。')
        return
    css_content = '''body { font-family: 'Arial', sans-serif; margin: 0; padding: 0; background: #f4f4f4; }
header { background: #007bff; color: white; padding: 20px; text-align: center; }
.subject-grid, .content-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 20px; padding: 20px; }
.subject-card, .content-card { background: white; border-radius: 8px; padding: 15px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); text-align: center; }
.subject-card h2 { margin: 0; }
.content-card img { max-width: 100%; height: auto; border-radius: 4px; }
.filters { margin-top: 10px; }
#search, #category { padding: 8px; margin: 0 10px; }
'''
    with open(css_path, 'w', encoding='utf-8') as f:
        f.write(css_content)

def generate_js(output_dir):
    """在输出目录生成默认 script.js（仅当文件不存在时）。"""
    js_path = os.path.join(output_dir, 'script.js')
    if os.path.exists(js_path):
        print('script.js 已存在，跳过默认脚本写入以免覆盖。')
        return
    js_content = '''document.getElementById('search').addEventListener('input', filterContent);
document.getElementById('category').addEventListener('change', filterContent);

function filterContent() {
    const searchTerm = document.getElementById('search').value.toLowerCase();
    const category = document.getElementById('category').value;
    const cards = document.querySelectorAll('.content-card');
    
    cards.forEach(card => {
        const title = card.querySelector('h3').textContent.toLowerCase();
        const cardCategory = card.dataset.category;
        const matchesSearch = title.includes(searchTerm);
        const matchesCategory = !category || cardCategory === category;
        
        card.style.display = matchesSearch && matchesCategory ? 'block' : 'none';
    });
}
'''
    with open(js_path, 'w', encoding='utf-8') as f:
        f.write(js_content)

# 主函数
root_path = os.path.dirname(os.path.abspath(__file__))
titles = load_titles(os.path.join(root_path, 'titles.json'))

subjects = ['chemistry', 'math', 'physics', 'biology']

# 获取子目录
subdirs = {}
for subject in subjects:
    subject_path = os.path.join(root_path, subject)
    if os.path.exists(subject_path):
        subdirs[subject] = [d for d in os.listdir(subject_path) if os.path.isdir(os.path.join(subject_path, d))]

# 生成页面
generate_main_page(subjects, root_path)
generate_css(root_path)
generate_js(root_path)

for subject in subjects:
    generate_subject_page(subject, subdirs.get(subject, []), titles, root_path)

print("页面生成完成。")
