# PackageStats

A Package (or generally speaking, a Project) Scanner and Viewer! It scans all entries and outputs their File Stats and other information.
(See [Usage](#usage) & [Scanner Output](#Scanner-Output))

**Currently are major Changes and rewrites happening for Multi Save Support! Because of that in the most cases the functions will only work partial!**

## Contents

- [Description](#description)
- [Contents](#contents)
- [Installation](#installation)
- [Usage](#usage)
- [API](#api)
- [Scanner Output](#Scanner-Output)
- [Todo](#todo)
- [Contributing](#contributing)
- [License](#license)

---

## Installation

Install it with npm globally:

```bash
  npm install packageStats -g
```

or locally

```bash
  npm install packageStats
```

---

## Usage

When installed globally, it can be called with a CLI:

```bash
 packageStats scan
```

When installed locally, it can be run with npm:

```bash
 npm run packageStats:scan
```

Both can be imported and can be used directly in the code:

```javascript
const packageStats = require("packageStats");
// or
import packageStats from "packageStats";

console.log(packageStats.scan());
```

Nearly all methods are configurable (See [API](#api)).

---

## API

### Scanner

#### scan(path, save, log)

Scans all entries and outputs their File Stats and other information.

returns the filetree as `Object` (See [Scanner Output](#Scanner-Output)). Logging and Saving can optionally be enabled with the `log` and `save` arguments.

```javascript
packageStats.scan(path, save, log);
// or
packageStats.scan(path, save);
// or
packageStats.scan(path);
// or
packageStats.scan(options);
```

| options          | Type      | Description                                                                        |
| :--------------- | :-------- | :--------------------------------------------------------------------------------- |
| `path`           | `String`  | The path to scan                                                                   |
| `save`           | `boolean` | Enables saving the scan                                                            |
| `log`            | `boolean` | Enables logging of current scanning Information                                    |
| `exclude`        | `String`  | Excludes an Entry if the condition or pattern is matched ([Excluding](#Excluding)) |
| `withExtensions` | `boolean` | Enables/Disables File Extensions                                                   |
| `Options`        | `Object`  | Can include any Options as Propetyabove                                            |

---

#### print(path)

Prints the file tree and Scan Stats as a formatted `String` to the console.

```javascript
packageStats.print(path);
// or
packageStats.print(options);
```

| Parameter | Type     | Description                                                                 |
| :-------- | :------- | :-------------------------------------------------------------------------- |
| `path`    | `string` | (**Required**) path to File Tree Save (default is value of `SaveFile Path`) |

#### inspect(id, path)

Inspects an Element from the File Tree.

```javascript
packageStats.inspect(options);
// or
packageStats.inspect(id);
// or
packageStats.inspect(id, path);
```

| Parameter | Type     | Description                                                                 |
| :-------- | :------- | :-------------------------------------------------------------------------- |
| `id`      | `string` | (**Required**) Name of the File                                             |
| `path`    | `string` | (**Required**) path to File Tree Save (default is value of `SaveFile Path`) |

#### openViewer(port, ip)

Opens the Viewer (See Viewer).

```javascript
packageStats.openViewer(options);
// or
packageStats.openViewer();
// or
packageStats.openViewer(port);
// or
packageStats.openViewer(port, ip);
```

| Parameter | Type     | Description                                    |
| :-------- | :------- | :--------------------------------------------- |
| `port`    | `string` | port to open the viewer (default is "8080")    |
| `ip`      | `string` | ip to open the viewer (default is "127.0.0.1") |
| `args`    | `string` | args for the viewer                            |

#### closeViewer()

Closes the viewer gracefully

```javascript
packageStats.closeViewer();
```

#### cleanup()

```javascript
packageStats.cleanup();
```

deletes the saved scan

#### help()

prints out the help info

```javascript
packageStats.help();
```

#### version()

prints out the version of package.

```javascript
packageStats.version();
```

---

## Scanner Output

The Output is an `Object` with following structure:

- File Count (`fileCount`)
- Folder Count (`folderCount`)
- Scan Time (`time`)
- Contents/Array (`contents`)
  - Name (`name`)
  - Relative Path (`path`)
  - Full Path (`fullpath`)
  - Entry Type (`type`)
  - isFolder (`isFolder`)
  - isFile (`isFile`)
  - Entry Size (`size`)
  - Line Count (`lines`)
  - Entry Depth (`depth`)
  - Creation Time (`birthtime`)
  - Last Modified Time (`lastModified`)

---

## Viewer

Displayes a Scan Save as File Tree. By clicking on an entry, the according information will be formatted and displayed.
The Viewer can be opened with the `openViewer` function/command and gracefully closed with the `closeViewer` function/command or by pressing `STRG + C` in the terminal.

---

## Todo

- Better saving Support
- Custom Excluding Support
- Bundeling

---

## Contributing

Contributions are always welcome!

If you find a bug or want to propose a feature, please open an issuse or contact me!

---

## License

[MIT](https://choosealicense.com/licenses/mit/)
