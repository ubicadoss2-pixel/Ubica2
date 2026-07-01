import app from "./src/app";

console.log("Registered routes:");
app._router.stack.forEach((middleware: any) => {
  if (middleware.route) { // routes registered directly on the app
    console.log(middleware.route.path);
  } else if (middleware.name === "router") { // router middleware
    middleware.handle.stack.forEach((handler: any) => {
      let route;
      route = handler.route;
      if (route) {
        console.log("Router Path:", route.path);
      }
    });
  }
});
