// jss:
import { toCssValue, } from 'jss'; // base technology of our cssfn components
import { supportedProperty, supportedValue,
// @ts-ignore
 } from 'css-vendor';
const isLiteralObject = (object) => object && (typeof (object) === 'object') && !Array.isArray(object);
const isStyle = (object) => isLiteralObject(object);
const renameProps = (style) => {
    // stores the style's entries __only_if__ the modification is needed:
    let styleArrLazy = null;
    for (const [propName, propValue, propIndex] of Object.entries(style).map(([propName, propValue], propIndex) => [propName, propValue, propIndex])) {
        if (propName.startsWith('--'))
            continue; // ignores css variable
        const newPropName = supportedProperty(propName);
        const changePropName = (newPropName !== false) && (propName !== newPropName);
        const propValueNorm = toCssValue(propValue, /*ignoreImportant:*/ false);
        const newPropValue = supportedValue(newPropName, propValueNorm);
        const changePropValue = (newPropValue !== false) && (propValueNorm !== newPropValue);
        if ((propName !== 'fallbacks') && !changePropName && !changePropValue)
            continue; // ignores unnecessary to be renamed
        /*
            initialize styleArrLazy (if was not initialized).
            
            convert LiteralObject to Array, so the prop order preserved.
            the order of the prop is guaranteed to be __preserved__
            so to rename the prop, just search with known `propIndex`.
        */
        if (!styleArrLazy)
            styleArrLazy = Object.entries(style);
        if (propName === 'fallbacks') {
            const fallbacks = styleArrLazy[propIndex][1];
            if (Array.isArray(fallbacks)) {
                styleArrLazy[propIndex][1] = fallbacks.map((item) => isStyle(item) ? renameProps(item) : item);
            }
            else if (isStyle(fallbacks)) {
                styleArrLazy[propIndex][1] = renameProps(fallbacks);
            } // if
        }
        else {
            if (changePropName) {
                // set the prefixed propName:
                styleArrLazy[propIndex][0] = newPropName;
            } // if
            if (changePropValue) {
                // set the prefixed propValue:
                styleArrLazy[propIndex][1] = newPropValue;
            } // if
        } // if
    } // for
    if (styleArrLazy)
        return Object.fromEntries(styleArrLazy); // has changed => return the modified
    return style; // no changes => return the original
};
const onProcessStyle = (style, rule, sheet) => {
    return renameProps(style);
};
const onChangeValue = (propValue, propName, rule) => {
    if (propName.startsWith('--'))
        return propValue; // ignores css variable
    const newPropName = supportedProperty(propName);
    const propValueNorm = toCssValue(propValue, /*ignoreImportant:*/ false);
    const newPropValue = supportedValue(newPropName, propValueNorm);
    const changePropValue = (newPropValue !== false) && (propValueNorm !== newPropValue);
    if (changePropValue)
        return newPropValue; // the modified value
    return propValue; // the original value
};
export default function pluginShort() {
    return {
        onProcessStyle,
        onChangeValue,
    };
}
