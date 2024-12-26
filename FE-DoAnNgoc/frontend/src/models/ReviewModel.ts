export interface ReviewModel {
  rating: number;
  comment: string;
  product: string;
  user: {
    name: string;
    _id: string;
  };
  _id: string;
}
