// import packages
const {
  client,
  createTables,
  seeProducts,
  seeProduct,
  createUser,
  createCart,
  seeCart,
  createCartProduct,
  seeCartProducts,
  addProductToCart,
  deleteProductFromCart,
  changeQuantity,
  updateUser,
  deleteUser,
  seeUsers,
  createProduct,
  updateProduct,
  deleteProduct,
  authenticate,
  findUserWithToken
} = require("./db");

const express = require("express");
const app = express();

// parse the body into JS Objects
app.use(express.json());

// Log the requests as they come in
app.use(require("morgan")("dev"));

//for deployment only
const path = require('path');
app.get('/', (req, res)=> res.sendFile(path.join(__dirname, '../client/dist/index.html')));
app.use('/assets', express.static(path.join(__dirname, '../client/dist/assets'))); 

// middleware function call next with an error if the header named authorization does not have a valid token.
// If there is a valid token, the req.user should be set to the user who's id is contained in the token
const isLoggedIn = async (req, res, next) => {
  try {
    console.log(req.headers.authorization);
    req.user = await findUserWithToken(req.headers.authorization);
    next();
  } catch (ex) {
    next(ex);
  }
};

//  middleware for admin
const isAdmin = async (req, res, next) => {
  if (!req.user.is_admin){
    res.status(201).send("Not admin");
  } else {
    res.send(req.user);
  }
};

// NOT LOGIN IN USER
// functions - view all products, create account, login to account

// not require login in to see available products
app.get("/api/products", async (req, res, next) => {
  try {
    res.send(await seeProducts());
  } catch (ex) {
    next(ex);
  }
});

app.get("/api/products/:productId", async (req, res, next) => {
  try {
    res.send(await seeProduct(req.params.productId));
  } catch (ex) {
    next(ex);
  }
});

// create an account
app.post("/api/auth/register", async (req, res, next) => {
  try {
    res.send(await createUser(req.body));
  } catch (ex) {
    next(ex);
  }
});

// login to account
app.post("/api/auth/login", async (req, res, next) => {
  try {
    res.send(await authenticate(req.body));
  } catch (ex) {
    next(ex);
  }
});

// LOGIN USER
//  functions - add product to cart, see cart, edit cart, purchase

// user account
app.get("/api/auth/me", isLoggedIn, (req, res, next) => {
  try {
    res.send(req.user);
  } catch (ex) {
    next(ex);
  }
});

// login in user to see cart details
app.get("/api/users/:id/cart", isLoggedIn, async (req, res, next) => {
  try {
    if (req.params.id !== req.user.id) {
      const error = Error("not authorized");
      error.status = 401;
      throw error;
    }
    res.send(await seeCart(req.params.id));
  } catch (ex) {
    next(ex);
  }
});

// login user to see cart products
//Since, we're passing in the id of the user as a param
//We need to fetch Carts that are associated with that User
//Once we find the cart with that User, we can then use that cart_id to query for information about the cart
app.get("/api/users/:id/cart/cartProducts", isLoggedIn, async (req, res, next) => {
  try {
    if (req.params.id !== req.user.id) {
      const error = Error("not authorized");
      error.status = 401;
      throw error;
    }
    const cartId = await seeCart(req.params.id);
    const cartProducts = await seeCartProducts(cartId.id);
    res.status(201).send(cartProducts);
  } catch (ex) {
    next(ex);
  }
});

// login user to add product to cart
app.post("/api/users/:id/cart/cartProducts", isLoggedIn, async (req, res, next) => {
  try {
    if (req.params.id !== req.user.id) {
      const error = Error("not authorized");
      error.status = 401;
      throw error;
    }
    const cartId = await seeCart(req.params.id);
    res.send(await addProductToCart({
      cart_id: cartId.id,
      product_id: req.body.product_id,
      quantity: req.body.quantity,
    }));
  } catch (ex) {
    next(ex);
  }
});

// login user to change quantity of product in cart
app.put("/api/users/:id/cart/cartProducts/:cartProductId", isLoggedIn, async (req, res, next) => {
  try {
    if (req.params.id !== req.user.id) {
      const error = Error("not authorized");
      error.status = 401;
      throw error;
    }
    const cartId = await seeCart(req.params.id);
    res.send(await changeQuantity({
      cart_id: cartId.id,
      product_id: req.params.cartProductId,
      quantity: req.body.quantity,
    }));
  } catch (ex) {
    next(ex);
  }
});

// login user to delete product from cart
app.delete("/api/users/:id/cart/cartProducts/:cartProductId", isLoggedIn, async (req, res, next) => {
    try {
      if (req.params.user_id !== req.user.id) {
        const error = Error("not authorized");
        error.status = 401;
        throw error;
      }
      const cartId = await seeCart(req.params.id);
      await deleteProductFromCart({ cart_id: cartId.id, product_id: req.params.cartProductId });
      res.sendStatus(204);
    } catch (ex) {
      next(ex);
    }
  }
);

// login user to purchase products

//  login user to update information about user
app.put("/api/users/:id", isLoggedIn, async (req, res, next) => {
  try {
    if (req.params.id !== req.user.id) {
      const error = Error("not authorized");
      error.status = 401;
      throw error;
    }
    res.status(201).send(await updateUser({
      id: req.params.id,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      phone_number: req.body.phone_number
    }));
  } catch (ex) {
    next(ex);
  }
});

// login user to delete an account
app.delete("/api/users/:id", isLoggedIn, async (req, res, next) => {
  try {
    if (req.params.id !== req.user.id) {
      const error = Error("not authorized");
      error.status = 401;
      throw error;
    }
    await deleteUser(req.params.id);
    res.sendStatus(204);
  } catch (ex) {
    next(ex);
  }
});

//  ADMIN
//  functions - view products, edit products, view all users

// admin to see all products
app.get("/api/users/:id/products", isLoggedIn, isAdmin, async (req, res, next) => {
  try {
    if (req.params.id !== req.user.id) {
      const error = Error("not authorized");
      error.status = 401;
      throw error;
    }
    res.send(await seeProducts());
  } catch (ex) {
    next(ex);
  }
});

// admin to add a product
app.post("/api/users/:id/products", isLoggedIn, isAdmin, async (req, res, next) => {
  try {
    if (req.params.id !== req.user.id) {
      const error = Error("not authorized");
      error.status = 401;
      throw error;
    }
    res.status(201).send(await createProduct({
      name: req.body.name,
      price: req.body.price,
      description: req.body.description,
      inventory: req.body.inventory
    }));
  } catch (ex) {
    next(ex);
  }
});

// admin to edit a product
app.post("/api/users/:id/products/:productId", isLoggedIn, isAdmin, async (req, res, next) => {
  try {
    if (req.params.id !== req.user.id) {
      const error = Error("not authorized");
      error.status = 401;
      throw error;
    }
    res.status(201).send(await updateProduct({
      id: req.params.productId,
      name: req.body.name,
      price: req.body.price,
      description: req.body.description,
      inventory: req.body.inventory
    }));
  } catch (ex) {
    next(ex);
  }
});

// admin to delete a product
app.delete("/api/users/:id/products/:productId", isLoggedIn, isAdmin, async (req, res, next) => {
  try {
    if (req.params.id !== req.user.id) {
      const error = Error("not authorized");
      error.status = 401;
      throw error;
    }
    await deleteProduct(req.params.productId);
    res.sendStatus(204);
  } catch (ex) {
    next(ex);
  }
});

// admin see all users
app.get("/api/users/:id/users", isLoggedIn, isAdmin, async (req, res, next) => {
  try {
    if (req.params.id !== req.user.id) {
      const error = Error("not authorized");
      error.status = 401;
      throw error;
    }
    res.send(await seeUsers());
  } catch (ex) {
    next(ex);
  }
});

const init = async () => {
  await client.connect();
  console.log("connected to database");
  await createTables();
  console.log("tables created");
  const [jack, lily, mark, coke, pasta, chocolate] = await Promise.all([
    createUser({ email: "jack@gmail.com", password: "mooo", is_admin: true}),
    createUser({ email: "lily@gmail.com", password: "rufruf", is_admin: false }),
    createUser({ email: "mark@gmail.com", password: "barkbark", is_admin: false }),
    createProduct({
      name: "coke",
      price: 3.99,
      description: "very good cookie",
      inventory: 5,
    }),
    createProduct({
      name: "pasta",
      price: 5.85,
      description: "very good pasta",
      inventory: 3,
    }),
    createProduct({
      name: "chocolate",
      price: 2.99,
      description: "very good chocolate",
      inventory: 3,
    }),
  ]);
  const users = await seeUsers();
  console.log("Users: ", users);
  const products = await seeProducts();
  console.log("Products: ", products);
  const carts = await Promise.all([
    createCart({ user_id: jack.id }),
    createCart({ user_id: lily.id }),
    createCart({ user_id: mark.id }),
  ]);
  console.log("Carts: ", carts);

  const productsInCart = await Promise.all([
    createCartProduct({
      cart_id: carts[0].id,
      product_id: chocolate.id,
      quantity: 2,
    }),
    createCartProduct({
      cart_id: carts[0].id,
      product_id: pasta.id,
      quantity: 1,
    }),
    createCartProduct({
      cart_id: carts[1].id,
      product_id: coke.id,
      quantity: 2,
    }),
    createCartProduct({
      cart_id: carts[1].id,
      product_id: pasta.id,
      quantity: 4,
    }),
    createCartProduct({
      cart_id: carts[2].id,
      product_id: coke.id,
      quantity: 4,
    }),
  ]);

  console.log(productsInCart);

  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`listening on port ${port}`));
};

init();
