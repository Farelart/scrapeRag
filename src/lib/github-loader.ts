import { GithubRepoLoader } from "@langchain/community/document_loaders/web/github";
import { Document } from "langchain/document";
import { summariseCode } from "./gemini";
import { generateEmbedding } from "./gemini";
import { db } from "~/server/db";

export const loadGithubRepo = async (
  githubUrl: string,
  githubToken?: string,
) => {
  const loader = new GithubRepoLoader(githubUrl, {
    accessToken: githubToken || "",
    branch: "main",
    ignoreFiles: [
      "package.json",
      "package-lock.json",
      "yarn.lock",
      "bun.lockb",
    ],
    recursive: true,
    unknown: "warn",
    maxConcurrency: 5,
  });

  const docs = await loader.load();
  return docs;
};



export const indexGithubRepo = async (
  projectId: string,
  githubUrl: string,
  githubToken?: string,
) => {
  const docs = await loadGithubRepo(githubUrl, githubToken);
  const allEmbeddings = await generateEmbeddings(docs);

  await Promise.allSettled(
    allEmbeddings.map(async (embedding, index) => {
      console.log(`processing ${index} of ${allEmbeddings.length}`);

      if (!embedding) return;

      console.log("inserting ...");

      const sourceCodeEmbedding = await db.sourceCodeEmbedding.create({
        data: {
          sourceCode: embedding.sourceCode,
          fileName: embedding.fileName,
          summary: embedding.summary,
          projectId,
        },
      });

      await db.$executeRaw`
        UPDATE "SourceCodeEmbedding" 
        SET "summaryEmbedding" = ${embedding.embedding}::vector
        WHERE "id" = ${sourceCodeEmbedding.id}; 
    `;

      console.log("inserted !");
    }),
  );
};

const generateEmbeddings = async (docs: Document[]) => {
  return await Promise.all(
    docs.map(async (doc) => {
      if (!doc.metadata?.source) {
        console.error("Missing file source metadata", doc);
        return null;
      }

      const summary = (await summariseCode(doc)) as string;
      if (!summary) {
        console.error(
          `No summary generated for document: ${doc.metadata.source}`,
        );
        return null; // Or handle accordingly
      }
      const embedding = await generateEmbedding(summary);
      if (!embedding) {
        console.error(
          `No embedding generated for summary of file: ${doc.metadata.source}`,
        );
        return null; // Or handle accordingly
      }

      return {
        summary,
        embedding,
        sourceCode: JSON.parse(JSON.stringify(doc.pageContent)),
        fileName: doc.metadata.source,
      };
    }),
  );
};






/* export const indexGithubRepo = async (
  projectId: string,
  githubUrl: string,
  githubToken?: string,
) => {
  // First fetch and store the docs without embeddings
  const docs = await loadGithubRepo(githubUrl, githubToken);

  // Store initial data without embeddings
  await Promise.allSettled(
    docs.map(async (doc) => {
      const summary = await summariseCode(doc);

      // Store initial record without embedding
      const sourceCodeEmbedding = await db.sourceCodeEmbedding.create({
        data: {
          sourceCode: JSON.parse(JSON.stringify(doc.pageContent)),
          fileName: doc.metadata.source,
          summary: summary || "",
          projectId,
        },
      });

      // Queue embedding generation for later
      return sourceCodeEmbedding.id;
    }),
  );

  // Process embeddings separately
  processEmbeddings(projectId).catch(console.error);
};

// New function to process embeddings
async function processEmbeddings(projectId: string) {
  // Get records without embeddings
  const records = await db.sourceCodeEmbedding.findMany({
    where: {
      projectId,
      summaryEmbedding: null,
    },
  });

  // Process in smaller batches to handle rate limits
  const batchSize = 5;
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);

    await Promise.allSettled(
      batch.map(async (record) => {
        try {
          const embedding = await generateEmbedding(record.summary);
          console.log("Embedding generated:", embedding); // Add this line

          if (Array.isArray(embedding) && embedding.length === 768) {
            await db.$executeRaw`
              UPDATE "SourceCodeEmbedding" 
              SET "summaryEmbedding" = ${embedding}::vector
              WHERE "id" = ${record.id}
            `;
          } else {
            console.error(`Invalid embedding format for ${record.fileName}`);
          }

          console.log(`Updated embedding for ${record.fileName}`);
        } catch (error) {
          console.error(
            `Failed to generate embedding for ${record.fileName}:`,
            error,
          );
        }
      }),
    );

    // Add delay between batches to respect rate limits
    if (i + batchSize < records.length) {
      await new Promise((resolve) => setTimeout(resolve, 10000));
    }
  }
} */
