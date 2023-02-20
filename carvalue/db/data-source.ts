import { DataSource, DataSourceOptions } from 'typeorm';

export const dataSourceOptions: DataSourceOptions = {
  type: 'sqlite',
  database: 'test.sqlite',
  entities:
    process.env.NODE_ENV === 'development'
      ? ['dist/**/*.entity.js']
      : ['dist/**/*.entity.ts'],
  migrations: ['dist/db/migrations/*.js'],
};

const dataSource = new DataSource(dataSourceOptions);
export default dataSource;
