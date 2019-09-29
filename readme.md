# Description
Saving MMD(Miku Miku Dance) model on IndexedDB test.

IndexedDB is one type of local storage that can access from browser, so the model dose't uploaded to remote server.

(It means you are unnecessary to worry about copyrights of MMD model.)

# Dependency
- Three.js
- MMDLoader (partially changed from original.)

# Usage
## 1. Prepare http server
- I tested using this command.
```
python -m http.server 8000
```
## 2. Open page
- Open http://localhost:8000/app

- If it is your first access, there are only circle on ground.

- I tryed it on Chrome 77.

## 3. Save pmd or pmx model
- From `[select file]`, please select your pmd or pmx file.

## 4. Check model was saved
- Reload page, and there must be mmd model that you finarly saved.
- Close page or browser, and if you reopen the page, there must be mmd model that you finarly saved.