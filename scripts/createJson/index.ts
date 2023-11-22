import generateJsonFile from "./generateJsonFIle";

generateJsonFile()
  .then(() => {
    console.log("Generate: data.json, search.json");
  })
  .catch((error) => {
    console.error("Error: ", error);
  });
