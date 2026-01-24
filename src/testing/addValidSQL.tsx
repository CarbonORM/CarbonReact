export const addValidSQL: any[] = [];

export default function (sql: any) {
    const {expect} = require("@jest/globals");
    addValidSQL.push({[expect.getState().currentTestName.replaceAll(" ", "_").toLowerCase()]: sql});
}