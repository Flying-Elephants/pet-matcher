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

    try {
      const response = await admin.graphql(query);
      const json: any = await response.json();
      const operation = json.data?.currentBulkOperation || null;
      
      // Automatic Renew Logic: If a bulk operation just finished, we could trigger logic here,
      // but standard practice is to let webhooks handle CRUD events as implemented.
      
      return operation;
    } catch (e) {
      console.error("Error fetching bulk operation status:", e);
      return null;
    }
  }
};
