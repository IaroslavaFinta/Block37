// data layer
// tables - user, product, cart, cart_product

// imports
const pg = require("pg");
const client = new pg.Client(
  process.env.DATABASE_URL || "postgres://localhost/the_shopper_db"
);
const uuid = require("uuid");
const bcrypt = require('bcrypt');
// install the jsonwebtoken library and we also need a secret
const jwt = require('jsonwebtoken');
const JWT = process.env.JWT || 'shhh';

const createTables = async () => {
  const SQL = `
  DROP TABLE IF EXISTS users;
  DROP TABLE IF EXISTS products;\

  CREATE TABLE users(
    id UUID PRIMARY KEY,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    email VARCHAR(100) NOT NULL,
    password VARCHAR(100) NOT NULL,
    firstName VARCHAR(100),
    lastName VARCHAR(100),
    mailing_address VARCHAR(255) NOT NULL,
    phone_number VARCHAR(100),
    billing_information VARCHAR(255) NOT NULL,
    is_admin BOOLEAN DEFAULT FALSE,
  );

  CREATE TABLE products(
    id UUID PRIMARY KEY,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    name VARCHAR(100) NOT NULL,
    price INTEGER NOT NULL,
    description VARCHAR(255) NOT NULL,
    inventory INTEGER,
);

  CREATE TABLE carts(
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id) NOT NULL,
  );

  CREATE TABLE cart_products(
    id UUID PRIMARY KEY,
    cart_id UUID REFERENCES carts(id) NOT NULL,
    product_id UUID REFERENCES products(id) NOT NULL,
    quantity INTEGER NOT NULL,
    CONSTRAINT unique_cart_product UNIQUE (product_id, cart_id),
  );
  `;
  await client.query(SQL);
};

const createUser = async ({
  email,
  password,
  firstName,
  lastName,
  mailing_address,
  phone_number,
  billing_information,
}) => {
  const SQL = `
    INSERT INTO users(id, email, password, firstName, lastName, mailing_address, phone_number, billing_information)
    VALUES($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
  `;
  const response = await client.query(SQL, [
    uuid.v4(),
    email,
    await bcrypt.hash(password, 5),
    firstName,
    lastName,
    mailing_address,
    phone_number,
    billing_information,
  ]);
  return response.rows[0];
};

const createProduct = async ({ name, price, description, quantity }) => {
  const SQL = `
        INSERT INTO products(id, name, price, description, quantity)
        VALUES($1, $2, $3, $4, $5)
        RETURNING *
      `;
  const response = await client.query(SQL, [uuid.v4(), name, price, description, quantity]);
  return response.rows[0];
};

const createCart = async({ cart_id, product_id, quantity})=> {
  const SQL = `
    INSERT INTO carts(id, user_id)
    VALUES($1, $2)
    RETURNING *
  `;
  const response = await client.query(SQL,
    [uuid.v4(), user_id]);
  return response.rows[0];
};

const createCartProduct = async({ product_id, cart_id, quantity})=> {
  const SQL = `
    INSERT INTO cart_products(id, product_id, cart_id, quantity)
    VALUES($1, $2, $3, $4)
    RETURNING *
  `;
  const response = await client.query(SQL,
    [uuid.v4(), product_id, cart_id, quantity]);
  return response.rows[0];
};

const fetchUsers = async()=> {
  const SQL = `
    SELECT *
    FROM users
  `;
  const response = await client.query(SQL);
  return response.rows;
};

const fetchProducts = async()=> {
  const SQL = `
    SELECT *
    FROM products
  `;
  const response = await client.query(SQL);
  return response.rows;
};

const fetchCartProducts = async()=> {
  const SQL = `
    SELECT *
    FROM cart_products
  `;
  const response = await client.query(SQL);
  return response.rows;
};

const updateUser = async(id)=> {
  const SQL = `
    UPDATE users
    WHERE id = $1
  `;
  const response = await client.query(SQL, [id]);
  return response.rows;
};

const updateProduct = async()=> {
  const SQL = `
    UPDATE products
    WHERE id = $1
  `;
  const response = await client.query(SQL, [id]);
  return response.rows;
};

const updateCartProducts = async()=> {
  const SQL = `
    UPDATE cart_products
    WHERE id = $1
  `;
  const response = await client.query(SQL, [id]);
  return response.rows;
};

const deleteUser = async(id)=> {
  const SQL = `
    DELETE FROM users
    where id = $1
  `;
  await client.query(SQL, [id]);
};

const deleteProduct = async(id)=> {
  const SQL = `
    DELETE FROM products
    where id = $1
  `;
  await client.query(SQL, [id]);
};

const deleteCartProduct = async(id)=> {
  const SQL = `
    DELETE FROM cart_products
    where id = $1
  `;
  await client.query(SQL, [id]);
};

// check password during authentication
// Use bcrypt.compare to make sure that a user has provided a correct password by
// comparing the hash stored in the database and the plain text password passed by user
// generate and log a JWT token where the payload contains the id of the user
// send back the jwt token in the authenticate method
const authenticate = async({ email, password })=> {
  const SQL = `
    SELECT id, email
    FROM users
    WHERE email=$1;
  `;
  const response = await client.query(SQL, [email]);
  if(!response.rows.length || (await bcrypt.compare(password, response.rows[0].password)) === false){
    const error = Error('not authorized');
    error.status = 401;
    throw error;
  }
  const token = await jwt.sign({ id: response.rows[0].id}, JWT);
  return { token: token };
};

// use token to secure login process
// verify that token in the findUserByToken method
// use the id of verified token's payload
// using the id as the parameter in your SQL statement
const findUserWithToken = async(token)=> {
  let id;
  try {
    const payload = await jwt.verify(token, JWT);
    id = payload.id;
  }
  catch(ex){
    const error = Error('not authorized');
    error.status = 401;
    throw error;
  }
  const SQL = `
    SELECT id, email
    FROM users
    WHERE id=$1;
  `;
  const response = await client.query(SQL, [id]);
  if(!response.rows.length){
    const error = Error('not authorized');
    error.status = 401;
    throw error;
  }
  return response.rows[0];
};

module.exports = {
  client,
  createTables,
  createUser,
  createProduct,
  createCart,
  createCartProduct,
  fetchUsers,
  fetchProducts,
  fetchCartProducts,
  updateUser,
  updateProduct,
  updateCartProducts,
  deleteUser,
  deleteProduct,
  deleteCartProduct,
  authenticate,
  findUserWithToken,
};