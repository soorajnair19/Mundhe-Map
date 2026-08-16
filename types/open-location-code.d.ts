declare module "open-location-code" {
  export class OpenLocationCode {
    isFull(code: string): boolean;
    recoverNearest(code: string, latitude: number, longitude: number): string;
    decode(code: string): {
      latitudeLo: number;
      longitudeLo: number;
      latitudeHi: number;
      longitudeHi: number;
      latitudeCenter: number;
      longitudeCenter: number;
      codeLength: number;
    };
  }
}
