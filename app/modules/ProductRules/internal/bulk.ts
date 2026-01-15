import type { AdminApiContext } from "@shopify/shopify-app-react-router/server";
import db from "../../../db.server";

export const BulkOperationService = {
  async runProductSync(admin: AdminApiContext) {
    const query = `#graphql
      mutation {
        bulkOperationRunQuery(
          query: """
          {
            products {
              edges {
                node {
                  id
                  title
                  tags
                  variants(first: 10) {
                    edges {
                      node {
                        id
                        price
                      }
                    }
                  }
                }
              }
            }
          }
          """
        ) {
          bulkOperation {
            id
            status
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const response = await admin.graphql(query);

    if (response.status === 302) {
      throw response;
    }

    if (!response.ok) {
      throw new Error(`Bulk sync initiation failed: ${response.statusText}`);
    }

    const json: any = await response.json();

    if (json.errors) {
        throw new Error(json.errors.map((e: any) => e.message).join(", "));
    }
    
    if (json.data?.bulkOperationRunQuery?.userErrors?.length > 0) {
        throw new Error(json.data.bulkOperationRunQuery.userErrors.map((e: any) => e.message).join(", "));
    }

    return json.data.bulkOperationRunQuery;
  },

  async syncSingleProduct(admin: AdminApiContext, productId: string, shop: string) {
    const query = `#graphql
      query getProduct($id: ID!) {
        product(id: $id) {
          id
          title
        }
      }
    `;

    const response = await admin.graphql(query, { variables: { id: productId } });

    if (response.status === 302) {
      throw response;
    }

    if (!response.ok) {
      throw new Error(`Single product sync fetch failed: ${response.statusText}`);
    }

    const json: any = await response.json();

    if (json.errors) {
        throw new Error(json.errors.map((e: any) => e.message).join(", "));
    }

    const product = json.data?.product;
    if (product) {
        await db.syncedProduct.upsert({
            where: { id: product.id },
            update: { title: product.title, shop },
            create: { id: product.id, title: product.title, shop }
        });
        console.log(`Successfully synced single product: ${product.id}`);
    }
    return product;
  },

  async processSyncResult(url: string, shop: string) {
    if (!url) return 0;

    console.log(`Starting processing of bulk file: ${url}`);
    try {
        const response = await fetch(url);
        console.log(`Fetch bulk file response status: ${response.status} ${response.statusText}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch bulk result: ${response.status} ${response.statusText}`);
        }

        const text = await response.text();
        const lines = text.split("\n");
        
        let count = 0;
        
        for (const line of lines) {
            if (!line.trim()) continue;

            try {
                const node = JSON.parse(line);
                // Identifying products: ID starts with gid://shopify/Product/ and has title
                // Ensure it is not a child node (like variant) if flat structure is used, though our query was nested.
                // JSONL from nested query usually separates nodes.
                // Product node will have `title`.
                
                if (node.id && node.id.startsWith("gid://shopify/Product/") && !node.__parentId) {
                    await db.syncedProduct.upsert({
                        where: { id: node.id },
                        update: { title: node.title, shop, updatedAt: new Date() },
                        create: { id: node.id, title: node.title, shop }
                    });
                    count++;
                }
            } catch (e) {
                console.error("Error parsing/saving line:", e);
            }
        }
        
        console.log(`Processed ${count} products.`);
        return count;
    } catch (e) {
        console.error("Error processing sync result:", e);
        throw e;
    }
  },

  async deleteProduct(productId: string) {
    await db.syncedProduct.deleteMany({
        where: { id: productId }
    });
    console.log(`Successfully deleted local product record: ${productId}`);
  },

  async getStatus(admin: AdminApiContext) {
    const query = `#graphql
      query {
        currentBulkOperation {
          id
          status
          errorCode
          createdAt
          completedAt
          objectCount
          url
        }
      }
    `;

    const response = await admin.graphql(query);

    if (response.status === 302) {
      throw response;
    }

    if (!response.ok) {
      throw new Error(`Bulk status fetch failed: ${response.statusText}`);
    }

    const json: any = await response.json();

    if (json.errors) {
      console.error("GraphQL errors in getStatus:", json.errors);
      return null;
    }

    return json.data?.currentBulkOperation || null;
  }
};
