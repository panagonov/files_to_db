let fs = require("fs");
let utils = require("./_utils");

let xml_mapping = {
    trading_symbol: "ownershipDocument.issuer.issuerTradingSymbol",
    owner_name : "ownershipDocument.reportingOwner.reportingOwnerId.rptOwnerName",
    owner_cik : "ownershipDocument.reportingOwner.reportingOwnerId.rptOwnerCik",
    "address.city" : "ownershipDocument.reportingOwner.reportingOwnerAddress.rptOwnerCity",
    "address.state" : "ownershipDocument.reportingOwner.reportingOwnerAddress.rptOwnerState",
    "address.street1" : "ownershipDocument.reportingOwner.reportingOwnerAddress.rptOwnerStreet1",
    "address.street2" : "ownershipDocument.reportingOwner.reportingOwnerAddress.rptOwnerStreet2",
    "address.zip" : "ownershipDocument.reportingOwner.reportingOwnerAddress.rptOwnerZipCode",
};

let text_mapping = {
    "classification" : "COMPANY DATA.STANDARD INDUSTRIAL CLASSIFICATION",
    "irs_number" : "COMPANY DATA.IRS NUMBER",
};

let transform = (json) =>
{
    let names = (json.owner_name || "").replace(/\s+/g, " ").split(" ");
    let last_name = names[0];
    let first_name = names[1];
    let middle_name = names[2];

    last_name ? json.owner_last_name = last_name.toUpperCase() : null;
    first_name ? json.owner_first_name = first_name.toUpperCase() : null;
    middle_name ? json.owner_middle_name = middle_name.toUpperCase() : null;

    return json;
};

let parse = (text) =>
{
    let json_from_xml = utils.xml_to_json(text);
    let json_from_text = utils.text_to_json(text);

    let result = {};

    Object.keys(xml_mapping).forEach(key =>
    {
        let value = utils.getValueFromJSON(json_from_xml, xml_mapping[key]);
        if (value && value.trim())
            utils.setKeyInJSON(result, key, value)
    });

    Object.keys(text_mapping).forEach(key =>
    {
        let value = utils.getValueFromJSON(json_from_text, text_mapping[key]);
        if (value && value.trim())
            utils.setKeyInJSON(result, key, value)
    });

    return result
};

let run = (text) =>
{
    let json = parse(text);
    return transform(json);
};

module.exports = {
    run: run
}

let text = fs.readFileSync(__dirname + "/0001084869-18-000001.txt", "utf-8");
let json = run(text);
debugger