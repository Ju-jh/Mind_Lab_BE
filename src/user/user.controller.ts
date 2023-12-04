import {
  Controller,
  Get,
  UseGuards,
  Req,
  Res,
  Post,
  Headers,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JwtPayload, verify, sign } from 'jsonwebtoken';
import { UserService } from './user.service';
interface UserPayload extends JwtPayload {
  user: {
    id: number;
    email: string;
  };
}

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}
  private generateAccessToken(user: any): string {
    const secretKey = process.env.ACCESS_TOKEN_PRIVATE_KEY;
    const expiresIn = '24h';
    const accessToken = sign({ user }, secretKey, { expiresIn });
    return accessToken;
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleLoginCallback(@Req() req, @Res() res) {
    try {
      const accessToken = this.generateAccessToken(req.user);
      res.cookie('accessToken', accessToken, {
        httpOnly: true,
        path: '/',
      });
      res.redirect(process.env.FRONTEND_BASEURL);
    } catch (error) {
      console.error('Error in googleLoginCallback:', error);
      res.status(500).send('Internal Server Error');
    }
  }

  @Post('cookie')
  async getCookie(@Headers('cookie') cookie: string, @Res() res): Promise<any> {
    const cookies = cookie ? cookie.split(';') : [];
    let isCookie = false;

    for (const cookie of cookies) {
      const [name] = cookie.trim().split('=');
      if (name === 'accessToken') {
        isCookie = true;
        break;
      }
    }

    res.json({ isCookie });
  }

  @Post('getEmailAndPhoto')
  async getEmailAndPhotoByCookie(
    @Headers('cookie') cookie: string,
    @Res() res,
  ): Promise<any> {
    try {
      const result = await this.userService.getEmailAndPhotoByCookie(cookie);
      res.status(200).json(result);
    } catch (error) {
      console.error('Error in getEmailAndPhotoByCookie:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  @Get('logout')
  async logout(@Res() res) {
    res.clearCookie('accessToken', { path: '/' });
    res.redirect('https://mind-lab-fe-55b3987890a9.herokuapp.com/');
  }
}
