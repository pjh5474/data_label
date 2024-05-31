import os
import shutil

# 경로 설정
base_dir = "C:/Users/CWS/Documents/NomadCoder/data_label/server/data"
original_dir = os.path.join(base_dir, "original")

# 'original' 폴더가 없으면 생성
if not os.path.exists(original_dir):
    os.makedirs(original_dir)

# 'data' 폴더 내 모든 폴더를 순회
for folder_name in os.listdir(base_dir):
    folder_path = os.path.join(base_dir, folder_name)

    # 'original' 폴더는 제외
    if folder_name != "original" and os.path.isdir(folder_path):
        original_subdir = os.path.join(folder_path, "Original")

        # 'Original' 폴더가 있는지 확인
        if os.path.exists(original_subdir) and os.path.isdir(original_subdir):
            for file_name in os.listdir(original_subdir):
                if file_name.endswith(".jpg"):
                    # 이미지 파일 경로
                    file_path = os.path.join(original_subdir, file_name)

                    # 파일 복사
                    shutil.copy(file_path, original_dir)
                    print(f"Copied {file_path} to {original_dir}")
