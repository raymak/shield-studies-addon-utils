/* eslint-env node */

/*
this.prefs = class extends ExtensionAPI {
  getAPI(context) {
    return {
      prefs: {
        async get(preelemame) {
          return "getting";
        },
        async set(preelemame, value) {
          return "set";
        }
      }
    };
  }
}
*/

const FILEHEADER = `/* eslint-disable */

ChromeUtils.import("resource://gre/modules/ExtensionCommon.jsm");
ChromeUtils.import("resource://gre/modules/ExtensionUtils.jsm");

// eslint-disable-next-line no-undef
const { EventManager } = ExtensionCommon;
// eslint-disable-next-line no-undef
const { EventEmitter } = ExtensionUtils;
`;

function schema2shim(schemaApiJSON) {
  process.stdout.write(FILEHEADER);

  for (const i in schemaApiJSON) {
    const part = schemaApiJSON[i];
    const ns = part.namespace;
    const functionStrings = [];
    const eventStrings = [];
    // functions
    for (const j in part.functions) {
      const elem = part.functions[j];
      const args = (elem.parameters || []).map(x => x.name).join(", ");
      functionStrings.push(`
      /* ${elem.description || "@TODO no description given"} */
      ${elem.name}: ${["", "async "][Boolean(elem.async) * 1]}function ${
  elem.name
}  ( ${args} ) {
        console.log(called, "${elem.name}", ${args});
        return ${JSON.stringify(elem.defaultReturn)};
      },`);
    }
    // events
    for (const j in part.events) {
      const elem = part.events[j];
      // TODO const args = (elem.parameters || []).map(x => x.name).join(", ");
      eventStrings.push(`
      // https://firefox-source-docs.mozilla.org/toolkit/components/extensions/webextensions/events.html
      /* ${elem.description} */
      ${elem.name}: new EventManager(
        context,
        "${ns}.${elem.name}", fire => {
        const callback = value => {
          fire.async(value);
        };
        // RegisterSomeInternalCallback(callback);
        return () => {
          // UnregisterInternalCallback(callback);
        };
      }).api(),
      `);
    }

    // put it all together
    process.stdout.write(`
this.${ns} = class extends ExtensionAPI {
  getAPI(context) {
    return {
      ${functionStrings.join("\n")}

      ${eventStrings.join("\n")}
    }
  }
}`);
  }
}
const path = require("path");
schema2shim(require(path.resolve(process.argv[2])));
