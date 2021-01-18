# WORKFLOW

## Update the local master
```
git pull
```

## Create new branch
```
git checkout -b <BRANCH_NAME>
```

_Make the relevant implementations **ONLY** within the scope of your branch_

This means that if you find a bug or error or a new feature elsewhere outside the scope of the branch, another branch must be created to solve this new problem.

## Add changes
```
git add <FILENAME_OR_FOLDER>
git add .
git commit -m "<COMMIT_MESSAGE>"
```

## Create / update remote branch
```
git push --set-upstream origin <BRANCH_NAME>
git push
```

Create the PR by selecting the branch you just created.

## Commits convention

```
<type>: <subject>
```

### "type"

```
- feat: new features included
- fix: changes and corrections to existing features
- docs: adding or changing documentation in the repository
- style: changes in formatting, such as indentation, punctuation, spacing, folder and file names, etc.
- refactor: reorganizations in the source code that do not include or change business rules, for example extracting new functions, 
    changing internal interfaces, changing communication, optimizing algorithms, changing dependencies
- test: adding or changing tests
- task: tasks not related to functionality or source code; no change in production code
```
