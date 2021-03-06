import ma = require('vsts-task-lib/mock-answer');
import tmrm = require('vsts-task-lib/mock-run');
import path = require('path');

let taskPath = path.join(__dirname, '..\\src\\main.js');
let tr: tmrm.TaskMockRunner = new tmrm.TaskMockRunner(taskPath);

tr.setInput('templateType', 'custom');
tr.setInput('customTemplateLocation', 'C:\\custom.template.json');
tr.setInput('imageUri', 'imageUri');
tr.setInput('imageStorageAccount', 'imageStorageAccount');

process.env["RELEASE_RELEASENAME"] = "Release-1";

// provide answers for task mock
let a: any = <any>{
    "which": {
        "packer": "packer"
    },
    "checkPath": {
        "packer": true,
        "C:\\custom.template.json": true
    },
    "exec": {
        "packer --version": {
            "code": 0,
            "stdout": "0.12.3"
        },
        "packer fix -validate=false F:\\somedir\\tempdir\\100\\custom.template.json": {
            "code": 0,
            "stdout": "{ \"some-key\": \"some-value\" }"
        },
        "packer validate F:\\somedir\\tempdir\\100\\custom.template-fixed.json": {
            "code": 0,
            "stdout": "Executed Successfully"
        },
        "packer build -force F:\\somedir\\tempdir\\100\\custom.template-fixed.json": {
            "code": process.env["__packer_build_fails__"] === "true" ? 1 : 0,
            "stdout": process.env["__packer_build_fails__"] === "true" ? "packer build failed\r\nsome error" : "Executed Successfully\nOSDiskUri: https://bishalpackerimages.blob.core.windows.net/system/Microsoft.Compute/Images/packer/packer-osDisk.e2e08a75-2d73-49ad-97c2-77f8070b65f5.vhd\nStorageAccountLocation: SouthIndia",
         }
    },
    "exist": {
        "F:\\somedir\\tempdir\\100": true,
        "F:\\somedir\\tempdir\\100\\": true,
        "packer": true       
    },
    "rmRF": {
        "F:\\somedir\\tempdir\\100": { 'success': true }
    }
};

var ut = require('../src/utilities');
tr.registerMock('./utilities', {
    IsNullOrEmpty : ut.IsNullOrEmpty,
    HasItems : ut.HasItems,
    StringWritable: ut.StringWritable,
    PackerVersion: ut.PackerVersion,
    isGreaterVersion: ut.isGreaterVersion,
    deleteDirectory: function(dir) {
        console.log("rmRF " + dir);
    },
    copyFile: function(source: string, destination: string) {
        if(process.env["__copy_fails__"] === "true") {
            throw "copy failed";
        } else {
            console.log('copying ' + source + ' to ' + destination);
        }
    },
    writeFile: function(filePath: string, content: string) {
        console.log("writing to file " + filePath + " content: " + content);
    },
    findMatch: function(root: string, patterns: string[] | string) {
        return [patterns];
    },
    getCurrentTime: function() {
        return 100;
    },
    getTempDirectory: function() {
        return "F:\\somedir\\tempdir"
    },
    getCurrentDirectory: function() {
        return "basedir\\currdir";
    }
}); 

tr.setAnswers(a);
tr.run();