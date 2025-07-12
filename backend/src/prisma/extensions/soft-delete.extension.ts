import { Prisma } from '@prisma/client';

export const softDeleteExtension = Prisma.defineExtension((client) => {
  return client.$extends({
    name: 'softDelete',
    query: {
      $allModels: {
        async $allOperations({ args, query, operation, model }) {
          // Skip soft delete logic for create operations
          if (operation === 'create') {
            return query(args);
          }

          // For delete operations, perform soft delete
          if (operation === 'delete' || operation === 'deleteMany') {
            const updatedArgs = {
              ...args,
              data: {
                deletedAt: new Date(),
              },
            };
            return query(updatedArgs);
          }

          // For find operations, exclude soft deleted records
          if (operation === 'findFirst' || operation === 'findMany' || operation === 'findUnique' || operation === 'findFirstOrThrow' || operation === 'findUniqueOrThrow') {
            const where = (args.where as any) || {};
            const updatedWhere = {
              ...where,
              deletedAt: null,
            };
            return query({ ...args, where: updatedWhere });
          }

          // For count operations, exclude soft deleted records
          if (operation === 'count') {
            const where = (args.where as any) || {};
            const updatedWhere = {
              ...where,
              deletedAt: null,
            };
            return query({ ...args, where: updatedWhere });
          }

          // For update operations, ensure we don't update soft deleted records
          if (operation === 'update' || operation === 'updateMany') {
            const where = (args.where as any) || {};
            const updatedWhere = {
              ...where,
              deletedAt: null,
            };
            return query({ ...args, where: updatedWhere });
          }

          // For upsert operations, ensure we don't upsert soft deleted records
          if (operation === 'upsert') {
            const where = (args.where as any) || {};
            const updatedWhere = {
              ...where,
              deletedAt: null,
            };
            return query({ ...args, where: updatedWhere });
          }

          return query(args);
        },
      },
    },
  });
}); 