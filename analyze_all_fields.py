#!/usr/bin/env python3
import re
import json

def extract_admin_fields():
    with open(r'src/pages/admin/AdminModelDetails.tsx', 'r', encoding='utf-8') as f:
        content = f.read()

    # 提取 insertData.xxx = 模式的字段
    pattern = r'insertData\.([a-zA-Z0-9_]+)\s*='
    fields = re.findall(pattern, content)
    return sorted(fields)

def extract_config_fields():
    with open(r'src/utils/fieldLabels.ts', 'r', encoding='utf-8') as f:
        content = f.read()

    fields = set()

    # 找到 modelDetailsFieldGroups 部分
    groups_match = re.search(r'export const modelDetailsFieldGroups = ({.*?});', content, re.DOTALL)
    if groups_match:
        groups_str = groups_match.group(1)
        # 找到所有字段数组
        fields_matches = re.findall(r'\[(.*?)\]', groups_str)

        for fields_match in fields_matches:
            # 提取字段
            field_pattern = r"'([^']*)'"
            group_fields = re.findall(field_pattern, fields_match)
            fields.update(group_fields)

    return sorted(fields)

admin_fields = extract_admin_fields()
config_fields = extract_config_fields()

print("=== AdminModelDetails.tsx 中所有字段 ===")
for field in admin_fields:
    print(f"  - {field}")

print()
print("=== modelDetailsFieldGroups 中所有字段 ===")
for field in config_fields:
    print(f"  - {field}")

print()
print("=== 只在 Admin 中存在的字段 ===")
admin_set = set(admin_fields)
config_set = set(config_fields)
only_admin = admin_set - config_set
for field in sorted(only_admin):
    print(f"  - {field}")

print()
print(f"Admin 字段数: {len(admin_fields)}")
print(f"Config 字段数: {len(config_fields)}")
