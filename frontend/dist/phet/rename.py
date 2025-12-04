import os
import shutil

# 定义目录映射字典
dir_mapping = {
    "化学": "chemistry",
    "数学": "math",
    "物理": "physics",
    "生物": "biology",
    "普通化学": "general-chemistry",
    "数学概念": "math-concepts",
    "数学的应用": "math-applications",
    "光和辐射": "optics-radiation",
    "功、能量、功率": "work-energy-power",
    "声音 振动 波": "sound-vibration-wave",
    "热学": "thermodynamics",
    "电场、磁场、电路": "electric-magnetic-circuit",
    "运动": "motion"
}

def rename_directories(root_path):
    for dirpath, dirnames, filenames in os.walk(root_path, topdown=False):
        # 重命名子目录
        for dirname in dirnames:
            if dirname in dir_mapping:
                old_path = os.path.join(dirpath, dirname)
                new_name = dir_mapping[dirname]
                new_path = os.path.join(dirpath, new_name)
                try:
                    os.rename(old_path, new_path)
                    print(f"重命名: {old_path} -> {new_path}")
                except OSError as e:
                    print(f"重命名失败: {old_path} -> {new_path}, 错误: {e}")
                    # 如果重命名失败，尝试移动
                    try:
                        shutil.move(old_path, new_path)
                        print(f"移动: {old_path} -> {new_path}")
                    except OSError as e2:
                        print(f"移动失败: {old_path} -> {new_path}, 错误: {e2}")

# 获取脚本所在目录作为根目录
root_path = os.path.dirname(os.path.abspath(__file__))
rename_directories(root_path)
print("重命名完成。")
