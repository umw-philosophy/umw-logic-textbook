import re

md_file = '/Users/michaelreno/Downloads/Documents/Logic Project/umw-logic-textbook/book/drafts/Ch1Exercises-OddSolutions.md'
out_file = '/Users/michaelreno/Downloads/Documents/Logic Project/umw-logic-textbook/book/source/appendix-solutions.ptx'

with open(md_file, 'r', encoding='utf-8') as f:
    lines = f.readlines()

xml_lines = []
xml_lines.append('<?xml version="1.0" encoding="UTF-8"?>')
xml_lines.append('<appendix xml:id="appendix-solutions">')
xml_lines.append('  <title>Selected Solutions</title>')

in_section = False

for line in lines:
    line = line.strip()
    if not line or line.startswith('---') or line.startswith('# Chapter') or line.startswith('Solutions for all'):
        continue
    
    if line.startswith('## '):
        if in_section:
            xml_lines.append('  </section>')
        title = line.replace('## ', '')
        # create a safe xml id
        xml_id = "sol-" + re.sub(r'[^a-z0-9]+', '-', title.lower()).strip('-')
        xml_lines.append(f'  <section xml:id="{xml_id}">')
        xml_lines.append(f'    <title>{title}</title>')
        in_section = True
        continue
    
    # It's a paragraph/solution
    # bold mapping
    line = re.sub(r'\*\*(.*?)\*\*', r'<term>\1</term>', line)
    # italic mapping
    line = re.sub(r'\*(.*?)\*', r'<em>\1</em>', line)
    
    # blockquotes mapping (some have >)
    if line.startswith('> '):
        line = line.replace('> ', '')
    
    xml_lines.append(f'    <p>{line}</p>')

if in_section:
    xml_lines.append('  </section>')

xml_lines.append('</appendix>')

with open(out_file, 'w', encoding='utf-8') as f:
    f.write('\n'.join(xml_lines))

print("Created appendix-solutions.ptx")
