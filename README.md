# cssdefs

TypeScript types for every CSS property, regenerated weekly from [MDN data](https://github.com/mdn/data) and [webref](https://github.com/w3c/webref).

## Install

```sh
npm install cssdefs
```

## Usage

```ts
import type { CSSDefs } from 'cssdefs';

const style: CSSDefs = {
  display: 'flex',
  justifyContent: 'space-between',
};
```

Keywords are offered for autocompletion. A property whose syntax takes lengths, colors or functions also accepts any string, a numeric one also accepts numbers, and every property accepts `initial`, `inherit` and `unset`.

Autocompletion offers only the values worth writing. System colors, `revert` and `revert-layer` are left out of it; a property that takes free values still accepts them as strings.

## Versioning

- Patch: properties or values were added.
- Minor: properties or values were removed from the specifications.
- Major: the shape of `CSSDefs` changed.

## License

MIT
