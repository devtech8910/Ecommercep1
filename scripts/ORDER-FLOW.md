# Order Flow Verification

Run `npm run test:orders` with `CATALOG_PLAYWRIGHT_MODULE`, `CATALOG_BCRYPT_MODULE`, and `CATALOG_QA_OUTPUT` configured for the local test dependencies and screenshots.

The test uses the actual authentication, account-session, product, and order handlers. Only their storage and external account-service transport are replaced with isolated test storage. Passwords are checked with bcrypt. Temporary customer and administrator accounts are created only inside the test process. No live accounts, orders, payments, or shipments are changed.

The workflow checks customer login, cart quantity changes, delivery-address selection, COD ordering, failed saves, retry protection, My Orders, a fresh mobile browser, Buy Now with quantity one, preservation of the normal cart, administrator login, confirmation, dashboard totals, customer bill printing/download, and administrator print-frame generation. Item tax rounding is reconciled to the stored order total, including zero-tax and zero-delivery snapshots. Barcodes use the locally served Code 128 build of [JsBarcode](https://github.com/lindell/JsBarcode), with its MIT license retained.

The ordinary localhost catalog preview remains read-only for product and order changes. Login is forwarded to the existing production authentication service. Deploy the frontend and functions together to use the changes in production.

For a separate interactive local test site, run `node scripts/serve-local-flow.cjs` with `CATALOG_BCRYPT_MODULE` configured. It listens only on `127.0.0.1:8081` and uses the same isolated handlers as the flow test. Temporary administrators are `admin1@local.test` and `admin2@local.test`, with password `TestDashboard!2026`. A temporary customer uses `customer@local.test` and the same password. All test records reset when this server restarts. These accounts do not exist in production.

## Remaining Configuration And Limits

- Seller address, GSTIN, PAN, product HSN codes, and applicable tax rates need verified business data. The current checkout retains the existing 18% tax and Rs 150 delivery calculation; the flow test validates its arithmetic, not tax compliance.
- Online payment is unavailable; only COD was tested.
- Orders validate the available size stock but do not reserve or decrement inventory. Reservation and concurrent order writes need a reliable transaction/concurrency design before high-volume production use.
- The account service still uses the existing JSONBlob user store. Moving account data to protected storage requires a separate migration, not another parallel account database.
- Live deployment and real-account verification were not performed by this test.
