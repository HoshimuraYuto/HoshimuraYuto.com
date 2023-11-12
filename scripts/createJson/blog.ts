import generateJsonFile from "./generateJsonFIle";

generateJsonFile("blog-flat", "flat")
  .then(() => {
    console.log("Generate: blog-flat.json");
  })
  .catch((error) => {
    console.error("Error: ", error);
  });

generateJsonFile("blog-nest", "nest")
  .then(() => {
    console.log("Generate: blog-nest.json");
  })
  .catch((error) => {
    console.error("Error: ", error);
  });
