
# PackageStats

A Package (or generally speaking, a Project) Scanner and Viewer! It scans all entries and outputs their File Stats and other information (See Usage).

## Contents

- [Description](#description)
- [Contents](#contents)
- [Installation](#installation)
- [Usage](#usage)
- [API](#api)
- [Todo](#todo)
- [Contributing](#contributing)
- [License](#license)
## Installation

Install it with npm globally:

```bash
  npm install packageStats -g
```

or locally
```bash
  npm install packageStats 
```
## Usage

if installed globally, it can be called with the Cli:
```bash
 packageStats scan
```

When installed locally, it can be run with npm:
```bash
 npm run packageStats:scan
```

Both can be imported and can be directly in the code:
```javascript
 const packageStats = require('packageStats');
 // or
 import packageStats from 'packageStats';
 
 console.log(packageStats.scan())
```
Nearly all methods are configurable (See Reference).

## API

### Scanner

#### scan({ options })

Scans all entries and outputs their File Stats and other information (See Usage).

returns the filetree as `Object` (See Sanner Output). Logging and Saving can optionally be enabled with the `log` and `save` arguments.

```javascript
 packageStats.scan(options)
 // or
 packageStats.scan(path)
 // or
 packageStats.scan(path, save)
 // or
 packageStats.scan(path, save, log)
```

| options | Type      | Description                |
| :------ | :-------  | :------------------------- |
| `path`  | `string`  | The path to scan           |
| `save`  | `bool`    | Enables saving the scan    |
| `log`  | `bool`     | Enables logging of current scanning Information |


#### Output:

The Ouput is an `Object` with following structure


--- 

#### print(path, style)

Prints the file tree as a formatted `String` out. The style can be changed with the `style` argument!

Returns the formatted output as `String` and logs it to the console.

```javascript
 packageStats.print(options)
 // or
 packageStats.print(style)
 // or
 packageStats.print(style, path);
```

| Parameter | Type     | Description                       |
| :-------- | :------- | :-------------------------------- |
| `path`    | `string` |  (**Required**) path to File Tree Save (default is value of `SaveFilePath` Property) |
| `style` | `number` | style of the output as number between 0 and 1 (default is `0`) | 


---
#### inspect({ options })

Inspects an Element from the fileTree.

```javascript
 packageStats.inspect(options)
 // or
 packageStats.inspect(id)
 // or
 packageStats.inspect(id, path)
```

| Parameter | Type     | Description                       |
| :-------- | :------- | :-------------------------------- |
| `Id`      | `string` | (**Required**) Name of the File   |
| `Path`    | `string` | (**Required**) path to File Tree Save (default is value of `SaveFilePath` Property) |


---
### Viewer

#### openViewer({ options })

Opens the Viewer (See Viewer).

```javascript
 packageStats.openViewer(options)
 // or
 packageStats.openViewer()
 // or
 packageStats.openViewer(port)
 // or
 packageStats.openViewer(port, ip)
```
| Parameter | Type     | Description                       |
| :-------- | :------- | :-------------------------------- |
| `port`    | `string` | port to open the viewer (default is "8080")    |
| `ip`      | `string` | ip to open the viewer (default is "127.0.0.1") |
| `args`    | `string` | args for the viewer               |


---

#### closeViewer()

Closes the viewer

```javascript
 packageStats.closeViewer()
```

---

### General

#### cleanup()

```javascript
 packageStats.cleanup()
```
cleans up the saved scan 

---

#### help()

prints out the help info

```javascript
 packageStats.help()
```

---

#### packageInfo(selector)

prints out information about the package. It output can be filtered with `selector` parameter. Currently avaliable selectors are all keys within the `package.json`.

```javascript
 packageStats.packageInfo(options)
 // or
 packageStats.packageInfo()
 // or
 packageStats.packageInfo(selector)
```
## Todo

- Better saving Support
- Custom Excluding Support
- Bundeling

---
## Contributing

Contributions are always welcome!

If you find a bug or want to propose a feature, please open an issuse or contact me!

## License

[MIT](https://choosealicense.com/licenses/mit/)

