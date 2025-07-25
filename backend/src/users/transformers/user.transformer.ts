import { BaseTransformer } from '../../core/transformers/base.transformer';

interface UserData {
  id: number;
  email: string;
  name: string | null;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserResource {
  email: string;
  name: string | null;
  role: string;
}

export class UserTransformer extends BaseTransformer<UserData, UserResource> {
  protected toResource(item: UserData): UserResource {
    return {
      email: item.email,
      name: item.name,
      role: item.role,
    };
  }
} 