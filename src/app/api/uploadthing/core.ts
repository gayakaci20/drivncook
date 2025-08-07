import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";

const f = createUploadthing();

const auth = (req: Request) => ({ id: "fakeId" });  

 
export const ourFileRouter = {
   
  imageUploader: f({
    image: {
      /**
       * For full list of options and defaults, see the File Route API reference
       * @see  s: 
       */
      maxFileSize: "4MB",
      maxFileCount: 1,
    },
  })
     
    .middleware(async ({ req }) => {
       
      const user = await auth(req);

       
      if (!user) throw new UploadThingError("Unauthorized");

       
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
       
      console.log("Upload complete for userId:", metadata.userId);

      console.log("file url", file.url);

       
      return { uploadedBy: metadata.userId };
    }),

   
  documentUploader: f({
    pdf: { maxFileSize: "8MB", maxFileCount: 1 },
    image: { maxFileSize: "8MB", maxFileCount: 1 },
  })
    .middleware(async ({ req }) => {
       
      const url = new URL(req.url);
      const documentType = url.searchParams.get("documentType") || "unknown";
      
       
      return { 
        userId: "anonymous", 
        documentType,
        uploadedAt: new Date().toISOString()
      };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Document upload complete:", {
        userId: metadata.userId,
        documentType: metadata.documentType,
        fileName: file.name,
        fileUrl: file.url,
        fileSize: file.size
      });

       
      return { 
        uploadedBy: metadata.userId,
        documentType: metadata.documentType,
        fileUrl: file.url,
        fileName: file.name,
        fileSize: file.size
      };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
