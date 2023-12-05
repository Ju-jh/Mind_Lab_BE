import { Resolver, Mutation, Query, Context, Args } from '@nestjs/graphql';
import { Survey } from './survey.entity';
import { SurveyService } from './survey.service';
import { JwtPayload, verify } from 'jsonwebtoken';
import { UserService } from 'src/user/user.service';

interface UserPayload extends JwtPayload {
  user: {
    email: string;
  };
}
@Resolver()
export class SurveyResolver {
  constructor(
    private readonly surveyService: SurveyService,
    private readonly userService: UserService,
  ) {}

  @Mutation(() => Survey)
  async createSurvey(@Context('req') req): Promise<Survey> {
    const cookieHeader = await req.headers.cookie;
    const userEmail = this.extractEmailFromCookie(cookieHeader);
    const userId = await this.userService.findUserIdByEmail(userEmail);
    const createdSurvey = await this.surveyService.createSurvey(userId);
    return createdSurvey;
  }

  @Query(() => [Survey])
  async getMySurvey(@Context('req') req): Promise<Survey[]> {
    const cookieHeader = await req.headers.cookie;
    const userEmail = this.extractEmailFromCookie(cookieHeader);
    const userId = await this.userService.findUserIdByEmail(userEmail);
    const mySurveys = await this.surveyService.getMySurvey(userId);
    return mySurveys;
  }

  @Query(() => [Survey])
  async getAllSurvey(): Promise<Survey[]> {
    const mySurveys = await this.surveyService.getAllSurvey();
    return mySurveys;
  }

  @Mutation(() => Survey)
  async deleteSurvey(
    @Args('surveyId') surveyId: string,
    @Context('req') req,
  ): Promise<any> {
    const cookieHeader = await req.headers.cookie;
    const userEmail = this.extractEmailFromCookie(cookieHeader);
    const userId = await this.userService.findUserIdByEmail(userEmail);
    console.log(surveyId, 'surveyId입니다');
    const deleteSurvey = await this.surveyService.deleteSurvey(
      surveyId,
      userId,
    );
    return deleteSurvey;
  }

  private extractEmailFromCookie(cookieHeader: string): string | null {
    const cookies = cookieHeader ? cookieHeader.split(';') : [];
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      let accessToken = null;
      if (name === 'accessToken') {
        accessToken = value;
        const decodedToken: UserPayload = verify(
          accessToken,
          process.env.ACCESS_TOKEN_PRIVATE_KEY,
        ) as UserPayload;
        if (decodedToken && decodedToken.user && decodedToken.user.email) {
          const userEmail = decodedToken.user.email;
          console.log(userEmail, '여기가 userEmail');
          return userEmail;
        }
      }
    }
  }
}
