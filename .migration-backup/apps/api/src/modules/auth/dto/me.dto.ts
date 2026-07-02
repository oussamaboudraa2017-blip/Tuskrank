import { ApiProperty } from '@nestjs/swagger';

export class MeDto {
  @ApiProperty({
    description: 'Internal user uuid.',
    example: '4f8d3c4c-67c7-4f56-9a8b-d1d6f6c2d6b5',
  })
  id!: string;

  @ApiProperty({
    description: 'User email (Supabase auth.users.email).',
    example: 'user@tuskrank.com',
    nullable: true,
  })
  email!: string | null;

  @ApiProperty({
    description:
      'Effective role from app_metadata.user_role / user_metadata.role.',
    example: 'authenticated',
  })
  role!: string;
}
