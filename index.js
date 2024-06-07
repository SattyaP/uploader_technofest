import { editData } from "./utils/editData.js";
import { submitData } from "./utils/submitData.js";

const command = process.env.MODEL;

switch (command) {
    case "submit":
        submitData();
        break;
    case "edit":
        editData();
        break;
    default:
        console.log("Invalid command");
        break;
}