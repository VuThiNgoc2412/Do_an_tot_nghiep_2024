export interface ProductModel {
  _id: string;
  name: string;
  photos: Photo[];
  price: number;
  stock: number;
  category: string;
  description: string;
  ratings: number;
  numOfReviews: number;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface Photo {
  public_id: string;
  url: string;
  _id: string;
}
