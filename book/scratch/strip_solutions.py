import re
import os

ptx_file = '/Users/michaelreno/Downloads/Documents/Logic Project/umw-logic-textbook/book/source/chapters/ch-what-is-an-argument.ptx'

with open(ptx_file, 'r', encoding='utf-8') as f:
    content = f.read()

# Strip out all <solution>...</solution> blocks
# re.DOTALL makes . match newlines
content = re.sub(r'\s*<solution>.*?</solution>', '', content, flags=re.DOTALL)

with open(ptx_file, 'w', encoding='utf-8') as f:
    f.write(content)

print("Stripped <solution> tags from ch-what-is-an-argument.ptx")
