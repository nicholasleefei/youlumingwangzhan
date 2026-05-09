#!/usr/bin/env python3
import re
import json

def extract_admin_fields():
    with open(r'src/pages/admin/AdminModelDetails.tsx', 'r', encoding='utf-8') as f:
        content = f.read()

    # 提取 insertData.xxx = 模式的字段
    pattern = r'insertData\.([a-zA-Z0-9_]+)\s*='
    fields = re.findall(pattern, content)
    return set(fields)

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

    return fields

admin_fields = extract_admin_fields()
config_fields = extract_config_fields()

# 找出 admin 中有但 config 中没有的字段
missing_in_config = admin_fields - config_fields

print("AdminModelDetails.tsx 中赋值但 modelDetailsFieldGroups 配置中缺失的字段：")
if missing_in_config:
    for field in sorted(missing_in_config):
        print(f"  - {field}")
else:
    print("  所有字段都已配置")

print()
print(f"Admin 字段数量: {len(admin_fields)}")
print(f"Config 字段数量: {len(config_fields)}")
print(f"缺失字段数量: {len(missing_in_config)}")
