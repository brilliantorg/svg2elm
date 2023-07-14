import path from "path";
import fs from "fs";
import { camelCase,pascalCase } from "change-case";

const { Elm } = require("./Main.elm");

type Ok = { type: "Ok"; elm: string };
type Err = { type: "Err"; error: string };
type Result = Ok | Err;

export async function generateModule(
    moduleName: string,
    filePaths: string[]
): Promise<string> {
    const moduleHeader = generateModuleHeader("Bits.Icon.CodeGen");
    const typeUnion = await generateType(moduleName, filePaths);
    const all = await generateAll(moduleName, filePaths);
    const caseStatement = await generateCaseStatement(moduleName, filePaths);
    const functions = await generateFunctions(moduleName, filePaths)

    return `${moduleHeader}\n${typeUnion}\n${all}\n${caseStatement}\n${functions}`;
}

export async function generateFunctions(
    moduleName: string,
    filePaths: string[]
): Promise<string> {
    const functions = await Promise.all(
        filePaths.map(async filePath => {
            const basename = path.basename(filePath, ".svg");
            const content = await fs.promises.readFile(filePath);
            return generateSvgFunction(basename, content.toString());
        })
    );

    return functions.join("\n");
}

export function generateSvgFunction(
    name: string,
    code: string
): Promise<string> {
    return new Promise((resolve, reject) => {
        const app = Elm.Main.init({ flags: { name, code } });

        app.ports.compiled.subscribe((result: Result) => {
            if (result.type === "Ok") {
                resolve(result.elm);
            } else {
                reject(result.error);
            }
        });
    });
}

export function generateModuleHeader(moduleName: string) {
    return `module ${moduleName} exposing (..)

import Svg
import VirtualDom exposing (attribute)
`;
}


export async function generateCaseStatement(
    moduleName: string,
    filePaths: string[]
): Promise<string> {
    const cases = await Promise.all(
        filePaths.map(async filePath => {
            const basename = path.basename(filePath, ".svg");
            const iconType = pascalCase(basename);
            const functionName = camelCase(basename);

            return `    ${iconType} -> ${functionName}`
        })
    );


    return `svgForIcon iconType =\n  case iconType of\n${cases.join("\n")}`;
}

export async function generateType(
    moduleName: string,
    filePaths: string[]
): Promise<string> {
    const types = await Promise.all(
        filePaths.map(async filePath => {
            const basename = path.basename(filePath, ".svg");
            const iconType = pascalCase(basename);

            return iconType
        })
    );


    return `type IconType =\n  ${types.join(" | ")}`;
}

export async function generateAll(
    moduleName: string,
    filePaths: string[]
): Promise<string> {
    const types = await Promise.all(
        filePaths.map(async filePath => {
            const basename = path.basename(filePath, ".svg");
            const functionName = camelCase(basename);
            const typeName = pascalCase(basename);

            return `{ name = "${basename}", svgFunction = ${functionName}, type_ = ${typeName} }`
        })
    );


    return `all =\n[${types.join(" , ")}]`;
}



/* FOR INSIDE OF THE Core Bits.Icon module */
export async function generateConstructors(
    moduleName: string,
    filePaths: string[]
): Promise<string> {
    const constructors = await Promise.all(
        filePaths.map(async filePath => {
            const basename = path.basename(filePath, ".svg");
            const functionName = camelCase(basename);
            const typeName = pascalCase(basename);

            return `{-| ${basename} -}\n${functionName} : Icon\n${functionName} = create ${typeName}`
        })
    );

    return constructors.join("\n");
}

export async function generateExports(
    moduleName: string,
    filePaths: string[]
): Promise<string> {
    const constructors = await Promise.all(
        filePaths.map(async filePath => {
            const basename = path.basename(filePath, ".svg");
            const functionName = camelCase(basename);

            return functionName
        })
    );

    return constructors.join(",");
}
