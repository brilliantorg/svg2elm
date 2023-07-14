import yargs from "yargs";
import { generateModule, generateConstructors, generateExports } from "./svg2elm";

const args = yargs
    .usage(
        "svg2elm -m module svgfile ..\n\nPrints an Elm module with the provided name and function per SVG file."
    )
    .option("module", {
        alias: "m",
        describe: "The name of the Elm Module to generate"
    }).argv;

async function run() {
    try {
        process.stdout.write(await generateModule(args.m as string, args._));
        process.exit(0);
    } catch (err) {
        console.error(
            "svg2elm: Something went wrong while parsing your SVG file. Make sure the file exists and that the SVG syntax is valid.\n\n"
        );
        throw err;
    }
}

run();
