const fs = require('fs');
const path = require('path');

module.exports = (relativeDir) => {
    const dir = path.resolve(relativeDir);

    return fs.readdirSync(dir).filter(f => f.endsWith(`.js`)).map(f => ({
        name: f.split(`.`).slice(0, -1).join(`.`),
        module: require(`${dir}/${f}`)
    }));
}