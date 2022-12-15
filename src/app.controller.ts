import { Body, Controller, Get, Param, Post } from '@nestjs/common';

interface AuthSignature {
  accountId: string;
  blockHeight: number;
  publicKey: string;
  signedBlockHeight: string;
}

interface Profile {
  age?: number;
  education?: string;
  favoriteJohnCarpenterMovie?: string;
  gender?: boolean;
  income?: number;
  interests?: number;
  location?: string;
  occupation?: string;
}

interface CreateQueryRequest {
  attributes: Array<{ key: string; value: string }>;
  authSignature: AuthSignature;
  totalAccounts: number;
}

interface ViewResultsRequest {
  authSignature: AuthSignature;
  organizationId: string;
  queryId: string;
}

interface RegisterConsumerRequest {
  name: string;
  contractId: string;
  publicKey: string;
  signedTx: string;
}

interface RegisterProducerRequest {
  accountId: string;
  authSignature: AuthSignature;
  profile: Profile;
}

@Controller()
export class AppController {
  @Get('consumer/:id')
  getConsumer(@Param('organizationId') organizationId: string) {
    return {
      organizationId,
    };
  }

  @Post('consumer')
  registerConsumer(@Body() consumer: RegisterConsumerRequest) {
    return {
      organizationId: `${consumer.name}-123`,
      transactionId: '4yRSZ11rrEVGYwoE99LFN9VKPtU3Mz9owr8JxwtJ9mjN',
      balance: 100,
    };
  }

  @Post('consumer/:organizationId/query')
  createQuery(@Body() query: CreateQueryRequest) {
    return {
      estimatedCost: Math.random() * 10000,
      queryId: Math.floor(Math.random() * 10000 * query.totalAccounts),
    };
  }

  @Post('consumer/:organizationId/results/:queryId')
  viewResults(@Body() viewResults: ViewResultsRequest) {
    return {
      cost: Math.random() * 10000,
      results: [],
    };
  }

  @Post('producer')
  registerProducer(@Body() producer: RegisterProducerRequest) {
    return {
      accountId: producer.accountId,
    };
  }
}
