import app from "./src/app";

console.log("Registered middlewares/routes on app:");
app._router.stack.forEach((layer: any) => {
  if (layer.route) {
    console.log("Route:", layer.route.path);
  } else if (layer.name === "router") {
    console.log("Router mounted at:", layer.regexp);
    if (layer.handle && layer.handle.stack) {
      layer.handle.stack.forEach((subLayer: any) => {
        if (subLayer.route) {
          console.log("  ->", Object.keys(subLayer.route.methods), subLayer.route.path);
        }
      });
    }
  }
});
