
import re

file_path = 'src/domain/mockData.ts'

with open(file_path, 'r') as f:
    content = f.read()

def replacer(match):
    # match.group(0) is the full primarySkills line
    # match.group(1) is the content inside [...]
    skills_str = match.group(1)
    # Parse skills
    skills = [s.strip().strip('"').strip("'") for s in skills_str.split(',')]
    skills = [s for s in skills if s] # filter empty
    
    if not skills:
        return 'primarySkill: "Unknown", secondarySkills: []'
        
    primary = skills[0]
    remainder = skills[1:]
    
    # Check if next line has secondarySkills
    # This is a simple regex replacement, looking ahead for secondarySkills is hard in a single pass if we don't assume lines.
    # tailored strategy:
    # 1. Replace primarySkills: [...] with primarySkill: "A", secondarySkills: ["B", ...]
    # 2. Then later, if we see secondarySkills twice in the same object, we might need to merge manually?
    # actually, the existing secondarySkills seem rare.
    # Let's see: if I just produce `secondarySkills: [...]` here, and there is already a `secondarySkills:` line following,
    # TypeScript object literal with duplicate keys? The second one wins? Or invalid?
    # Valid in JS, last one wins. But i want to merge.
    
    # Better approach: Read the file line by line?
    # No, let's just do the split.
    # primarySkills: ["A", "B"] -> primarySkill: "A", secondarySkills: ["B"]
    
    sec_str = ", ".join([f'"{s}"' for s in remainder])
    return f'primarySkill: "{primary}",\n    secondarySkills: [{sec_str}]'

# Simple pass: transform primarySkills to primarySkill + secondarySkills
# Note: This ignores existing secondarySkills line, which will essentially act as an override or duplicate key
# If existing secondarySkills follows, it will overwrite the one we just generated (if we generated one).
# If we want to merge, we need to be smarter.
# However, in the provided mockData, only emp-002 and emp-003 seem to have secondarySkills.
# Let's handle them specifically or just accept that I might need to fix them manually?
# Or I can try to handle merging.

# Let's try to match the whole block? No, too hard.
# I will use the simple replacement. 
# primarySkills: ["A", "B"] -> primarySkill: "A", secondarySkills: ["B"]
# If there is a subsequent `secondarySkills: ["C"]` line, it will look like:
# primarySkill: "A",
# secondarySkills: ["B"],
# secondarySkills: ["C"],
# 
# I will output this, and then I can run a second pass to merge adjacent secondarySkills?
# Or just let it be and fix the few cases manually? There are 2 cases only in the first 50 lines.
# Let's check the file for strictness.
# I'll stick to simple replacement and then I'll grep for "secondarySkills" to see if any duplicates were created.

new_content = re.sub(r'primarySkills:\s*\[(.*?)\]', replacer, content)

with open(file_path, 'w') as f:
    f.write(new_content)
